"""
Flask服务端 API 文档

提供文件上传和题目内容获取服务。

API 端点:
    POST /process_file
    功能：处理文件上传并返回题目内容

调用示例:
    1. 使用微信小程序:
    ```javascript
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: function(res) {
        const tempFilePath = res.tempFilePaths[0];
        wx.uploadFile({
          url: 'http://your-server:5000/process_file',
          filePath: tempFilePath,
          name: 'file',
          success: function(uploadRes) {
            const data = JSON.parse(uploadRes.data);
            console.log(data);
          }
        });
      }
    });
    ```

    2. 使用 Python requests:
    ```python
    import requests

    # 准备文件
    file_path = 'path/to/your/image.jpg'

    # 发送请求
    url = 'http://localhost:5000/process_file'
    files = {
        'file': open(file_path, 'rb')
    }

    try:
        response = requests.post(url, files=files)
        result = response.json()

        # 检查响应
        if result['code'] == 0:
            print('处理成功：', result['data'])
        else:
            print('处理失败：', result['msg'])

    except Exception as e:
        print('请求发生错误：', str(e))
    finally:
        # 确保文件被关闭
        files['file'].close()
    ```

返回格式:
    {
        "code": 0,       // 状态码：0成功，1文件未上传，2上传失败，-1系统错误
        "msg": "success", // 状态信息
        "data": {        // 处理结果
            // API返回的具体内容
            "code": 0,
            "cost": "0",
            "data": "...",
            "debug_url": "...",
            "msg": "Success",
            "token": 2305
        }
    }

错误码说明:
    0: 成功
    1: 文件未上传或未选择文件
    2: 文件上传API调用失败
    -1: 系统内部错误
"""

import json
import logging

import requests
from flask import Flask, jsonify, request

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# 全局配置缓存
_config = None


def load_config():
    """加载配置文件，只加载一次并缓存结果"""
    global _config
    if _config is None:
        try:
            with open("config.json", "r") as f:
                _config = json.load(f)
                # 验证必要配置项
                required_keys = ["UserToken", "API_URLS", "WORKFLOW_ID"]
                for key in required_keys:
                    if key not in _config:
                        raise ValueError(f"配置文件缺少必要项: {key}")
                return _config
        except FileNotFoundError:
            raise RuntimeError("配置文件 config.json 不存在")
        except json.JSONDecodeError:
            raise RuntimeError("配置文件格式错误，无法解析 JSON")
        except Exception as e:
            raise RuntimeError(f"加载配置文件失败: {str(e)}")
    return _config


def api_response(code, msg, data=None):
    """标准化API响应格式"""
    return jsonify({"code": code, "msg": msg, "data": data})


def upload_file(file_stream, filename, content_type):
    """
    上传文件到API

    Args:
        file_stream: 文件流
        filename: 文件名
        content_type: 文件类型

    Returns:
        dict: API的响应结果
    """
    config = load_config()
    user_token = config["UserToken"]

    api_urls = config.get("API_URLS", {})
    url = api_urls.get("upload_file", "https://api.coze.cn/v1/files/upload")
    headers = {"Authorization": f"Bearer {user_token}"}

    files = {"file": (filename, file_stream, content_type)}

    response = requests.post(url, headers=headers, files=files)
    return response.json()


def get_question_content(file_id):
    """
    获取题目内容和信息

    Args:
        file_id (str): 文件ID

    Returns:
        dict: API的响应结果
    """
    config = load_config()
    user_token = config["UserToken"]

    api_urls = config.get("API_URLS", {})
    url = api_urls.get("get_question", "https://api.coze.cn/v1/workflow/run")
    headers = {
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json",
    }

    data = {
        "parameters": {"input": json.dumps({"file_id": file_id})},
        "workflow_id": config.get("WORKFLOW_ID", "7492267986893193216"),
    }

    response = requests.post(url, headers=headers, json=data)
    return response.json()


@app.route("/process_file", methods=["POST"])
def process_file():
    """
    处理文件上传和获取题目内容的完整流程
    支持微信小程序的文件上传方式
    """
    try:
        config = load_config()
        max_file_size = config.get("MAX_FILE_SIZE", 10 * 1024 * 1024)
        allowed_extensions = config.get("ALLOWED_EXTENSIONS", [])

        # 检查是否有文件上传
        if "file" not in request.files:
            logger.warning("未检测到上传文件")
            return api_response(1, "没有上传文件")

        file = request.files["file"]
        if file.filename == "":
            logger.warning("用户未选择文件")
            return api_response(1, "未选择文件")

        # 验证文件大小
        if request.content_length and request.content_length > max_file_size:
            logger.warning(f"文件大小超过限制: {request.content_length} bytes")
            return api_response(
                3, f"文件大小超过限制，最大允许{max_file_size / 1024 / 1024:.2f}MB"
            )

        # 验证文件类型
        filename = file.filename
        ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
        if ext not in allowed_extensions:
            logger.warning(f"不支持的文件类型: {ext}")
            return api_response(
                4, f"不支持的文件类型，允许的类型: {allowed_extensions}"
            )

        try:
            # 步骤1：上传文件
            upload_result = upload_file(file.stream, file.filename, file.content_type)

            if upload_result.get("code") != 0:
                logger.error(f"文件上传失败: {upload_result.get('msg', '未知错误')}")
                return api_response(
                    2, f"文件上传失败: {upload_result.get('msg', '未知错误')}"
                )

            file_id = upload_result["data"]["id"]

            # 步骤2：获取题目内容
            question_result = get_question_content(file_id)

            # 步骤3：返回结果
            logger.info(f"文件处理成功: {file_id}")
            return api_response(0, "success", question_result)

        except Exception as e:
            logger.error(f"文件处理失败: {str(e)}", exc_info=True)
            return api_response(2, f"文件处理失败: {str(e)}")

    except Exception as e:
        logger.critical(f"系统内部错误: {str(e)}", exc_info=True)
        return api_response(-1, f"处理过程发生错误: {str(e)}")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
