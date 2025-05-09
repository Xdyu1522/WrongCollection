import os
import json
import requests

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
    
    # API端点
    url = 'https://api.coze.cn/v1/files/upload'
    
    # 设置请求头
    headers = {
        'Authorization': f'Bearer {user_token}'
    }
    
    # 准备文件
    with open(file_path, 'rb') as f:
        files = {
            'file': (os.path.basename(file_path), f)
        }
        
        # 发送请求
        response = requests.post(url, headers=headers, files=files)
        
        return response.json()

def main():
    # 示例用法
    try:
        # 这里替换为您要上传的实际文件路径
        file_path = "test/example.jpeg"  # 示例文件路径
        
        print("开始上传文件...")
        result = upload_file(file_path)
        
        if result['code'] == 0:
            print("文件上传成功！")
            print("文件信息：")
            print(json.dumps(result['data'], indent=2, ensure_ascii=False))
        else:
            print(f"上传失败：{result['msg']}")
            
    except Exception as e:
        print(f"发生错误：{str(e)}")

if __name__ == "__main__":
    main() 