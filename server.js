const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = 3000;

// 静态文件中间件
app.use(express.static(path.join(__dirname, 'public')));

// 登录并获取 Cookie
async function getLoginCookie() {
    try {
        const loginUrl = 'https://sso.dinghuo123.com/login';
        const loginData = new URLSearchParams({
            username: '18676246146',
            password: '246146'
        });

        const response = await axios.post(loginUrl, loginData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // 提取 Set-Cookie 响应头
        const cookies = response.headers['set-cookie'];
        if (!cookies) {
            throw new Error('登录失败，未返回 Cookie');
        }

        // 返回拼接后的 Cookie 字符串
        return cookies.join('; ');
    } catch (error) {
        console.error('获取登录 Cookie 失败:', error);
        throw error;
    }
}

// 库存代理端点
app.get('/proxy/stock', async (req, res) => {
    try {
        const { warehouseId } = req.query;
        const timestamp = Date.now();

        const targetUrl = `https://corp.dinghuo123.com/v2/inventory/list?currentPage=1&pageSize=196&totalCount=196&warehouseId=%5B%22${warehouseId}%22%5D&t=${timestamp}`;

        // 获取动态 Cookie
        const cookie = await getLoginCookie();

        const response = await axios.get(targetUrl, {
            headers: {
                'Cookie': cookie
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

        // 获取动态 Cookie
        const cookie = await getLoginCookie();

        const response = await axios.get(targetUrl, {
            headers: {
                'Cookie': cookie
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