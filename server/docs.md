# 全局说明
UserToken为 ./config.json UserToken的值为 "UserToken"键的取值

# 1. 上传文件
- 请求方式: POST
- 请求地址:  https://api.coze.cn/v1/files/upload

## Header 
### 参数
- Authorization : Bearer {UserToken}

## 返回结果 

参数 | 类型 | 说明
| ---- | ---- | ---- |
code | Integer | 状态码。0 代表调用成功。 
msg | String | 状态信息。API 调用失败时可通过此字段查看详细错误信息。
data | Object | 已上传的文件信息。

## 示例调用
```bash
curl --location --request POST 'https://api.coze.cn/v1/files/upload' \
--header 'Authorization: Bearer pat_OYDacMzM3WyOWV3Dtj2bHRMymzxP****' \
--form 'file=@"/test/1120.jpeg"'
```

## 示例返回
```json
{
    "code": 0,
    "data": {
        "bytes": 152236,
        "created_at": 1715847583,
        "file_name": "1120.jpeg",
        "id": "736949598110202****"
    },
    "msg": ""
}
```

# 2. 请求额错题内容和信息

- 请求方式: POST
- 请求地址: https://api.coze.cn/v1/workflow/run


## Header 
### 参数
- Authorization : Bearer {UserToken}
其余参数请参照示例调用

## 示例调用
```bash
curl -X POST 'https://api.coze.cn/v1/workflow/run' \
-H "Authorization: Bearer pat_fHpunI0g4MPp0zkz6ussS7g7p4VVaHv94KqdG34PqldXiwdmHUeBWwc1PwTN5B2O" \
-H "Content-Type: application/json" \
-d '{
  "parameters": {
    "input": "{\"file_id\": \"7501262967577575465\"}"
  },
  "workflow_id": "7492267986893193216"
}
```

## 示例返回
```json
{"code":0,"cost":"0","data":"{\"output\":\"```json\\n{\\n\\\"contain_questions\\\": true,\\n\\\"question_text\\\": \\\"40. 若函数$f(x)$在$x\\\\in[a,b]$时，函数值$y$的取值区间恰为$[\\\\frac{1}{b},\\\\frac{1}{a}]$，则称$[a,b]$为$f(x)$的一个“倒域区间”.定义在$[-2,2]$上的奇函数$g(x)$，当$x\\\\in[0,2]$时，$g(x)=-x^{2}+2x$.(1)求$g(x)$在$[1,2]$内的“倒域区间”；(2)将函数$g(x)$在定义域内所有“倒域区间”上的图像作为函数$y = h(x)$的图像，是否存在实数$m$，使集合$\\\\{(x,y)|y = h(x)\\\\}\\\\cap\\\\{(x,y)|y = x^{2}+m\\\\}$恰含有$2$个元素.\\\",\\n\\\"question_type\\\": \\\"解答题\\\",\\n\\\"selections\\\": {},\\n\\\"subquestions\\\": [\\n\\\"求$g(x)$在$[1,2]$内的“倒域区间”\\\",\\n\\\"将函数$g(x)$在定义域内所有“倒域区间”上的图像作为函数$y = h(x)$的图像，是否存在实数$m$，使集合$\\\\{(x,y)|y = h(x)\\\\}\\\\cap\\\\{(x,y)|y = x^{2}+m\\\\}$恰含有$2$个元素\\\"\\n],\\n\\\"subject\\\": {\\n\\\"main\\\": \\\"数学\\\",\\n\\\"confidence\\\": 0.9\\n}\\n}\\n```\"}","debug_url":"https://www.coze.cn/work_flow?execute_id=7501264192622051364&space_id=7492265827182723098&workflow_id=7492267986893193216&execute_mode=2","msg":"Success","token":2305}
```

# 3. 全局API指引

* input: 文件路径

步骤: 
1. 调用上传文件API将input的文件路径上传
2. 调用请求额错题内容和信息API, 输入参数中的"file_id"是第一步调用返回中的["data"]["id"]
3. 返回步骤二调用的结果
