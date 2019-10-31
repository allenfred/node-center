# quant-wsserver

[okex-node-sdk](https://github.com/okcoin-okex/okex-api-v3-node-sdk)

## WebSocket api

### 公共-Ticker 频道

#### 获取平台全部永续合约的最新成交价、买一价、卖一价和 24 交易量

send 示例
`{"op": "subscribe", "args": ["(swap/futures)/ticker:BTC-USD-SWAP"]}`

返回示例

```
{
    "table":"(swap/futures)/ticker",
    "data":[
        {
            "best_ask":"8382.7",
            "best_bid":"8382.6",
            "high_24h":"8803.2",
            "instrument_id":"BTC-USD-SWAP",
            "last":"8382.7",
            "low_24h":"8301",
            "open_24h":"8561.1",
            "open_interest":"1135263",
            "timestamp":"2019-10-11T09:10:23.320Z",
            "volume_24h":"4045320",
            "volume_token_24h":"47464.5"
        }
    ]
}
```

返回参数解释

|      参数名      | 参数类型 |            描述             |
| :--------------: | :------: | :-------------------------: |
|  instrument_id   |  String  |  合约名称，如 BTC-USD-SWAP  |
|     best_bid     |  String  |           买一价            |
|     best_ask     |  String  |           卖一价            |
|       last       |  String  |         最新成交价          |
|     high_24h     |  String  |        24 小时最高价        |
|     low_24h      |  String  |        24 小时最低价        |
|    volume_24h    |  String  | 24 小时成交量（按张数统计） |
| volume_token_24h |  String  |  24 小时成交量（按币统计）  |
|    timestamp     |  String  |         系统时间戳          |
|  open_interest   |  string  |           持仓量            |
|     open_24h     |  string  |        24 小时开盘价        |

### 公共-标记价格频道

#### 获取获取标记价格

send 示例
`{"op": "subscribe", "args": ["(swap/futures)/mark_price:BTC-USD-SWAP"]}`

其中 (swap/futures)/mark_price 为频道名，BTC-USD-SWAP 为 instrument_id

返回示例

```
{
    "table": "(swap/futures)/mark_price",
    "data": [{
        "instrument_id": "BTC-USD-SWAP",
        "mark_price": "5620.9",
        "timestamp": "2019-05-06T07:03:33.799Z"
    }]
}
```

返回参数解释

|    参数名     | 参数类型 |           描述            |
| :-----------: | :------: | :-----------------------: |
| instrument_id |  String  | 合约名称，如 BTC-USD-SWAP |
|  mark_price   |  String  |         标记价格          |
|   timestamp   |  String  |        系统时间戳         |

### 公共-限价频道

#### 获取合约当前交易的最高买价和最低卖价。

send 示例
`{"op": "subscribe", "args": ["(swap/futures)/price_range:BTC-USD-SWAP"]}`

其中 (swap/futures)/ price_range 为频道名，BTC-USD-SWAP 为 instrument_id

返回示例

```
{
    "table": "(swap/futures)/price_range",
    "data": [{
        "highest": "5665.9",
        "instrument_id": "BTC-USD-SWAP",
        "lowest": "5553.6",
        "timestamp": "2019-05-06T06:51:20.012Z"
    }]
}
```

返回参数解释

|    参数名     | 参数类型 |           描述            |
| :-----------: | :------: | :-----------------------: |
| instrument_id |  String  | 合约名称，如 BTC-USD-SWAP |
|    lowest     |  String  |         最低卖价          |
|    highest    |  String  |         最高买价          |
|   timestamp   |  String  |        系统时间戳         |

### 公共-交易频道

#### 获取最近的成交数据。

send 示例
`{"op": "subscribe", "args": ["(swap/futures)/trade:BTC-USD-SWAP"]}`

其中 (swap/futures)/trade 为频道名，BTC-USD-SWAP 为 instrument_id

返回示例

```
{
    "table": "(swap/futures)/trade",
    "data": [{
        "instrument_id": "BTC-USD-SWAP",
        "price": "5611.9",
        "side": "buy",
        "size": "2",
        "timestamp": "2019-05-06T06:51:24.389Z",
        "trade_id": "227897880202387456"
    }]
}
```

返回参数解释

|    参数名     | 参数类型 |           描述            |
| :-----------: | :------: | :-----------------------: |
| instrument_id |  String  | 合约名称，如 BTC-USD-SWAP |
|   trade_id    |  String  |          成交 id          |
|     price     |  String  |         成交价格          |
|     size      |  String  |         成交数量          |
|     side      |  String  |  成交方向（buy 或 sell）  |
|   timestamp   |  String  |        系统时间戳         |

### 公共-K 线频道

#### 获取合约的 K 线数据

频道列表：

(swap/futures)/candle60s // 1 分钟 k 线数据频道

(swap/futures)/candle180s // 3 分钟 k 线数据频道

(swap/futures)/candle300s // 5 分钟 k 线数据频道

(swap/futures)/candle900s // 15 分钟 k 线数据频道

(swap/futures)/candle1800s // 30 分钟 k 线数据频道

(swap/futures)/candle3600s // 1 小时 k 线数据频道

(swap/futures)/candle7200s // 2 小时 k 线数据频道

(swap/futures)/candle14400s // 4 小时 k 线数据频道

(swap/futures)/candle21600s // 6 小时 k 线数据频道

(swap/futures)/candle43200s // 12 小时 k 线数据频道

(swap/futures)/candle86400s // 1day k 线数据频道

(swap/futures)/candle604800s // 1week k 线数据频道

send 示例

`{"op": "subscribe", "args": ["futures/candle180s:BTC-USD-191227"]}`

其中 futures/candle180s 为频道名，BTC-USD-191227 为 instrument_id

返回示例

```

{
    "table":"futures/candle180s",
    "data":[
        {
            "candle":[
                "2019-09-25T10:00:00.000Z",
                "8533.02",
                "8553.74",
                "8527.17",
                "8548.26",
                "45247",
                "529.5858061"
            ],
            "instrument_id":"BTC-USD-191227"
        }
    ]
}
```

返回参数解释

|     参数名      | 参数类型 |           描述            |
| :-------------: | :------: | :-----------------------: |
|    timestamp    |  String  |        系统时间戳         |
|      open       |  String  |         开盘价格          |
|      high       |  String  |         最高价格          |
|       low       |  String  |         最低价格          |
|      close      |  String  |         收盘价格          |
|     volume      |  String  |       交易量（张）        |
| currency_volume |  String  |     按币折算的交易量      |
|  instrument_id  |  String  | 合约名称，如 BTC-USD-SWAP |
