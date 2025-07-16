## Gemini 调用方式

对于 Gemini 系列，我们提供原生调用和 Openai 兼容这 2 种调用方式。  
使用前运行 `pip install google-genai` 或 `pip install -U google-genai` ，安装（更新）原生依赖。

1️⃣ 对于原生调用，我们的 Gemini 调用支持 AI Studio 和 VertexAI 自动路由。转发方法主要是在内部传入 AiHubMix 密钥和请求链接。需要注意的是，这个链接和常规的 `base_url` 写法不同，请参考示例：

```
client = genai.Client(

    api_key="sk-***", # 🔑 换成你在 AiHubMix 生成的密钥

    http_options={"base_url": "https://aihubmix.com/gemini"},

)
```

2️⃣ 对于 Openai 兼容格式，则维持通用的 `v1` 端点：

```
client = OpenAI(

    api_key="sk-***", # 换成你在 AiHubMix 生成的密钥

    base_url="https://aihubmix.com/v1",

)
```

3️⃣ 对于 2.5 系列，如果你需要显示推理过程，可以使用以下 2 种方式：

1. 原生调用：传入 `include_thoughts=True`
2. OpenAI 兼容方式：传入 `reasoning_effort`

相关的详细调用可以参考下文的代码示例。


## Gemini 2.5 Flash 支持

Openai 兼容方式调用参考如下：

```
from openai import OpenAI

client = OpenAI(

    api_key="sk-***", # 换成你在 AiHubMix 生成的密钥

    base_url="https://aihubmix.com/v1",

)

completion = client.chat.completions.create(

    model="gemini-2.5-flash-preview-04-17-nothink",

    messages=[

        {

            "role": "user",

            "content": "Explain the Occam's Razor concept and provide everyday examples of it"

        }

    ]

)

print(completion.choices[0].message.content)
```

1. 用于复杂任务时，只需要将模型 id 设置为默认开启思考的 `-2.5-flash-preview-04-17` 即可。
2.  2.5 Flash 通过 `budget` （思考预算）来控制思考的深度，范围 0-16K，目前转发采用的是默认预算 1024，最佳边际效果为 16K。
