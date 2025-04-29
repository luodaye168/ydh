// // server.js
// const express = require('express');
// const axios = require('axios');
// const path = require('path');
// const app = express();
// const port = 3000;

// // 静态文件中间件
// app.use(express.static(path.join(__dirname, 'public')));

// // 代理端点
// app.get('/proxy', async (req, res) => {
//   try {
//     const warehouseId = req.query.warehouseId || '4033070'; // 默认玉林仓库
//     const timestamp = Date.now();

//     const targetUrl = `https://corp.dinghuo123.com/v2/inventory/list?currentPage=1&pageSize=196&totalCount=196&warehouseId=%5B%22${warehouseId}%22%5D&t=${timestamp}`;

//     // 请求库存列表
//     // https://corp.dinghuo123.com/v2/inventory/list?currentPage=1&pageSize=196&totalCount=196&warehouseId=%5B%22${warehouseId}%22%5D&t=${timestamp}

//     // 查库存种类总数
//     // https://corp.dinghuo123.com/v2/inventory/list?currentPage=1&pageSize=30&warehouseId=%5B%224032050%22%5D&t=1745894449008 

//     // 请求下单数量
//     // https://corp.dinghuo123.com/v2/statistics-reports/region/products/pie-chart?periodType=CUSTOM&beginDate=2025-04-28&endDate=2025-04-29&orderBy=quantity&departmentId=7370569&groupBy=PRODUCT&pageSize=10&currentPage=1&t=1745894723530

//     const response = await axios.get(targetUrl, {
//       headers: {
//         'Cookie': 'username=18676246146; ydh_instance=3417805; ydh_userId=18211987; jwt=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIzMTI3OTI2OTgiLCJzdWIiOiJ7XCJkYmlkXCI6MzQxNzgwNSxcInNcIjpcIlBDXCIsXCJ1aWRcIjoxODIxMTk4NyxcInVzZXJOYW1lXCI6XCIzMTI3OTI2OThcIixcInVzZXJUeXBlXCI6MX0iLCJleHAiOjE3NDY0NDYwODd9.SIBbvj-ZMzMXvojByU8PMUlyeEnGUg7jZ1vNcClX_Iw; aliyungf_tc=c0929c004f35e3ad5b90583fdd36753e867e25318041b20219cd962b63ed233d; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22312792698%22%2C%22%24device_id%22%3A%2219674f681a71266-099fa9272b1819-4c657b58-1327104-19674f681a8120d%22%2C%22props%22%3A%7B%22%24latest_referrer%22%3A%22%22%2C%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%7D%2C%22first_id%22%3A%2219674f681a71266-099fa9272b1819-4c657b58-1327104-19674f681a8120d%22%7D; acw_tc=ac11000117458906182973953e44159fb6a39c2405eaae6bc23f5ef550c803; SERVERID=f8047daf3aaa305e841baf0958e0028b|1745890645|1745890645'
//       }
//     });

//     res.json(response.data);
//   } catch (error) {
//     console.error('Proxy error:', error);
//     res.status(500).json({ error: '代理请求失败' });
//   }
// });

// app.listen(port, () => {
//   console.log(`服务已启动：http://localhost:${port}`);
// });



const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 3000;

// 静态文件中间件
app.use(express.static(path.join(__dirname, 'public')));

// 中间件：记录访问 IP
app.use((req, res, next) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 获取当前时间并格式化为 月日时分秒
    const now = new Date();
    const timestamp = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    // 打印访问日志
    console.log(`${timestamp} 访问 IP: ${clientIp}, 路径: ${req.originalUrl}`);
    next();
});

// 库存代理端点
app.get('/proxy/stock', async (req, res) => {
    try {
        const { warehouseId } = req.query;
        const timestamp = Date.now();

        const targetUrl = `https://corp.dinghuo123.com/v2/inventory/list?currentPage=1&pageSize=196&totalCount=196&warehouseId=%5B%22${warehouseId}%22%5D&t=${timestamp}`;

        const response = await axios.get(targetUrl, {
            headers: {
                'Cookie': 'username=18676246146; ydh_instance=3417805; ydh_userId=18211987; jwt=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIzMTI3OTI2OTgiLCJzdWIiOiJ7XCJkYmlkXCI6MzQxNzgwNSxcInNcIjpcIlBDXCIsXCJ1aWRcIjoxODIxMTk4NyxcInVzZXJOYW1lXCI6XCIzMTI3OTI2OThcIixcInVzZXJUeXBlXCI6MX0iLCJleHAiOjE3NDY0NDYwODd9.SIBbvj-ZMzMXvojByU8PMUlyeEnGUg7jZ1vNcClX_Iw; aliyungf_tc=c0929c004f35e3ad5b90583fdd36753e867e25318041b20219cd962b63ed233d; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22312792698%22%2C%22%24device_id%22%3A%2219674f681a71266-099fa9272b1819-4c657b58-1327104-19674f681a8120d%22%2C%22props%22%3A%7B%22%24latest_referrer%22%3A%22%22%2C%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%7D%2C%22first_id%22%3A%2219674f681a71266-099fa9272b1819-4c657b58-1327104-19674f681a8120d%22%7D; com.jiaxincloud.mcs.cookie.username=web8503873348855827; acw_tc=ac11000117458942346071153e8bc82b56cb097a16d5fca210b940e1bbb7ee; SERVERID=f8047daf3aaa305e841baf0958e0028b|1745895234|1745894679'
            }
        });

        res.json(response.data);
    } catch (error) {
        handleProxyError(error, res, '库存');
    }
});

// 订单统计代理端点
app.get('/proxy/orders', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const params = {
            periodType: 'CUSTOM',
            beginDate: startDate,
            endDate: endDate,
            orderBy: 'quantity',
            departmentId: '7370569',
            groupBy: 'PRODUCT',
            pageSize: 10,
            currentPage: 1,
            t: Date.now()
        };

        const targetUrl = `https://corp.dinghuo123.com/v2/statistics-reports/region/products/pie-chart?${new URLSearchParams(params)}`;

        const response = await axios.get(targetUrl, {
            headers: {
                'Cookie': 'username=18676246146; ydh_instance=3417805; ydh_userId=18211987; jwt=eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIzMTI3OTI2OTgiLCJzdWIiOiJ7XCJkYmlkXCI6MzQxNzgwNSxcInNcIjpcIlBDXCIsXCJ1aWRcIjoxODIxMTk4NyxcInVzZXJOYW1lXCI6XCIzMTI3OTI2OThcIixcInVzZXJUeXBlXCI6MX0iLCJleHAiOjE3NDY0NDYwODd9.SIBbvj-ZMzMXvojByU8PMUlyeEnGUg7jZ1vNcClX_Iw; aliyungf_tc=c0929c004f35e3ad5b90583fdd36753e867e25318041b20219cd962b63ed233d; sensorsdata2015jssdkcross=%7B%22distinct_id%22%3A%22312792698%22%2C%22%24device_id%22%3A%2219674f681a71266-099fa9272b1819-4c657b58-1327104-19674f681a8120d%22%2C%22props%22%3A%7B%22%24latest_referrer%22%3A%22%22%2C%22%24latest_traffic_source_type%22%3A%22%E7%9B%B4%E6%8E%A5%E6%B5%81%E9%87%8F%22%2C%22%24latest_search_keyword%22%3A%22%E6%9C%AA%E5%8F%96%E5%88%B0%E5%80%BC_%E7%9B%B4%E6%8E%A5%E6%89%93%E5%BC%80%22%7D%2C%22first_id%22%3A%2219674f681a71266-099fa9272b1819-4c657b58-1327104-19674f681a8120d%22%7D; com.jiaxincloud.mcs.cookie.username=web8503873348855827; acw_tc=ac11000117458942346071153e8bc82b56cb097a16d5fca210b940e1bbb7ee; SERVERID=f8047daf3aaa305e841baf0958e0028b|1745895234|1745894679'
            }
        });

        res.json(response.data);
    } catch (error) {
        handleProxyError(error, res, '订单统计');
    }
});

// 统一错误处理
function handleProxyError(error, res, type) {
    console.error(`${type}代理错误:`, error);
    const status = error.response?.status || 500;
    res.status(status).json({
        error: `${type}请求失败`,
        details: error.message
    });
}

app.listen(port, () => {
    console.log(`服务已启动：http://localhost:${port}`);
});