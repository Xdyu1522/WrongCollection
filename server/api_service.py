"""
Flask服务端 API 文档

提供文件上传和题目内容获取服务。

API 端点:
    POST /process_file
    功能：处理文件上传并返回题目内容
    
调用示例:
    1. 使用 curl:
    ```bash
    curl -X POST http://localhost:5000/process_file \
      -F "file=@/path/to/your/file.jpg"
    ```

    2. 使用 Python requests:
    ```python
    import requests
    
    url = 'http://localhost:5000/process_file'
    files = {
        'file': open('path/to/your/file.jpg', 'rb')
    }
    response = requests.post(url, files=files)
    print(response.json())
    ```

    3. 使用 JavaScript fetch:
    ```javascript
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    fetch('http://localhost:5000/process_file', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => console.log(data));
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

import os
import json
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

def load_config():
    """加载配置文件"""
    with open('config.json', 'r') as f:
        return json.load(f)

def upload_file(file_path):
    """
    上传文件到API
    
    Args:
        file_path (str): 要上传的文件路径
    
    Returns:
        dict: API的响应结果
    """
    config = load_config()
    user_token = config['UserToken']
    
    url = 'https://api.coze.cn/v1/files/upload'
    headers = {
        'Authorization': f'Bearer {user_token}'
    }
    
    with open(file_path, 'rb') as f:
        files = {
            'file': (os.path.basename(file_path), f)
        }
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
    user_token = config['UserToken']
    
    url = 'https://api.coze.cn/v1/workflow/run'
    headers = {
        'Authorization': f'Bearer {user_token}',
        'Content-Type': 'application/json'
    }
    
    data = {
        "parameters": {
            "input": json.dumps({"file_id": file_id})
        },
        "workflow_id": "7492267986893193216"
    }
    
    response = requests.post(url, headers=headers, json=data)
    return response.json()

@app.route('/process_file', methods=['POST'])
def process_file():
    """
    处理文件上传和获取题目内容的完整流程
    """
    try:
        # 检查是否有文件上传
        if 'file' not in request.files:
            return jsonify({
                'code': 1,
                'msg': '没有上传文件',
                'data': None
            })
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'code': 1,
                'msg': '未选择文件',
                'data': None
            })
            
        # 保存上传的文件到临时目录
        temp_path = os.path.join('temp', file.filename)
        os.makedirs('temp', exist_ok=True)
        file.save(temp_path)
        
        try:
            # 步骤1：上传文件
            upload_result = upload_file(temp_path)
            if upload_result['code'] != 0:
                return jsonify({
                    'code': 2,
                    'msg': f'文件上传失败: {upload_result["msg"]}',
                    'data': None
                })
            
            file_id = upload_result['data']['id']
            
            # 步骤2：获取题目内容
            question_result = get_question_content(file_id)
            
            # 步骤3：返回结果
            return jsonify({
                'code': 0,
                'msg': 'success',
                'data': question_result
            })
            
        finally:
            # 清理临时文件
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        return jsonify({
            'code': -1,
            'msg': f'处理过程发生错误: {str(e)}',
            'data': None
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 