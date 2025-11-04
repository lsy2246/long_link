/**
 * @api {post} /create Create Long Link
 */

// Path: functions/create.js

// ========== 预设配置区域 ==========
const PRESET_CONFIG = {
    char: 'c',           // 预设重复的字符
    minLength: 1000,      // 最小长度
    maxLength: 2000      // 最大长度
};
// ==================================

// 生成指定字符重复的长字符串
function generateLongString(char, minLength, maxLength) {
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    return char.repeat(length);
}

export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    const { request, env } = context;
    const originurl = new URL(request.url);
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("clientIP");
    const userAgent = request.headers.get("user-agent");
    const origin = `${originurl.protocol}//${originurl.hostname}`

    const options = {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const timedata = new Date();
    const formattedDate = new Intl.DateTimeFormat('zh-CN', options).format(timedata);
    
    const { url, expireDays } = await request.json();
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
    
    if (!url) return Response.json({ message: 'Missing required parameter: url.' });

    // url格式检查
    if (!/^https?:\/\/.{3,}/.test(url)) {
        return Response.json({ message: 'Illegal format: url.' }, {
            headers: corsHeaders,
            status: 400
        })
    }

    try {
        // 检查目标 url 是否已存在
        const existSlug = await env.DB.prepare(`SELECT slug as existSlug, expire_time FROM links where url = ?`).bind(url).first()

        if (existSlug) {
            return Response.json({ 
                slug: existSlug.existSlug, 
                link: `${origin}/${existSlug.existSlug}`,
                length: existSlug.existSlug.length,
                expireTime: existSlug.expire_time
            }, {
                headers: corsHeaders,
                status: 200
            })
        }

        const bodyUrl = new URL(url);

        if (bodyUrl.hostname === originurl.hostname) {
            return Response.json({ message: 'You cannot create a link to the same domain.' }, {
                headers: corsHeaders,
                status: 400
            })
        }

        // 使用预设配置生成长字符串 slug
        let slug = generateLongString(
            PRESET_CONFIG.char, 
            PRESET_CONFIG.minLength, 
            PRESET_CONFIG.maxLength
        );
        
        // 确保 slug 唯一（如果碰撞则重新生成）
        let existingSlug = await env.DB.prepare(`SELECT slug FROM links where slug = ?`).bind(slug).first();
        let attempts = 0;
        while (existingSlug && attempts < 10) {
            slug = generateLongString(
                PRESET_CONFIG.char, 
                PRESET_CONFIG.minLength, 
                PRESET_CONFIG.maxLength
            );
            existingSlug = await env.DB.prepare(`SELECT slug FROM links where slug = ?`).bind(slug).first();
            attempts++;
        }

        // 计算过期时间
        let formattedExpireDate = null;
        if (expireDays && expireDays > 0) {
            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + parseInt(expireDays));
            formattedExpireDate = new Intl.DateTimeFormat('zh-CN', options).format(expireDate);
        }

        const info = await env.DB.prepare(`INSERT INTO links (url, slug, ip, status, ua, create_time, expire_time) 
        VALUES (?, ?, ?, 1, ?, ?, ?)`).bind(url, slug, clientIP, userAgent, formattedDate, formattedExpireDate).run()

        return Response.json({ 
            slug: slug, 
            link: `${origin}/${slug}`,
            length: slug.length,
            expireTime: formattedExpireDate
        }, {
            headers: corsHeaders,
            status: 200
        })
    } catch (e) {
        return Response.json({ message: e.message }, {
            headers: corsHeaders,
            status: 500
        })
    }
}
