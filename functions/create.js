/**
 * @api {post} /create Create Long Link
 */

// ========== 预设配置区域 ==========
const PRESET_CONFIG = {
    chars: 'Cc',         // 预设字符集（将被随机组合）
    minLength: 1000,     // 最小长度
    maxLength: 2000      // 最大长度
};
// ==================================

// 从字符集中随机生成长字符串
function generateLongString(chars, minLength, maxLength) {
    const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
    const charArray = chars.split('');
    let result = '';
    
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charArray.length);
        result += charArray[randomIndex];
    }
    
    return result;
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
    const origin = `${originurl.protocol}//${originurl.hostname}`;

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
    
    const { url } = await request.json();
    
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
        });
    }

    try {
        // 检查目标 url 是否已存在
        const existSlug = await env.DB.prepare(`SELECT slug as existSlug FROM links where url = ?`).bind(url).first();

        if (existSlug) {
            return Response.json({ 
                slug: existSlug.existSlug, 
                link: `${origin}/${existSlug.existSlug}`,
                length: existSlug.existSlug.length
            }, {
                headers: corsHeaders,
                status: 200
            });
        }

        const bodyUrl = new URL(url);

        if (bodyUrl.hostname === originurl.hostname) {
            return Response.json({ message: 'You cannot create a link to the same domain.' }, {
                headers: corsHeaders,
                status: 400
            });
        }

        // 使用预设配置生成随机字符组合的 slug
        let slug = generateLongString(
            PRESET_CONFIG.chars, 
            PRESET_CONFIG.minLength, 
            PRESET_CONFIG.maxLength
        );
        
        // 确保 slug 唯一（如果碰撞则重新生成）
        let existingSlug = await env.DB.prepare(`SELECT slug FROM links where slug = ?`).bind(slug).first();
        let attempts = 0;
        while (existingSlug && attempts < 10) {
            slug = generateLongString(
                PRESET_CONFIG.chars, 
                PRESET_CONFIG.minLength, 
                PRESET_CONFIG.maxLength
            );
            existingSlug = await env.DB.prepare(`SELECT slug FROM links where slug = ?`).bind(slug).first();
            attempts++;
        }

        // 插入数据库
        const info = await env.DB.prepare(`INSERT INTO links (url, slug, ip, status, ua, create_time) 
        VALUES (?, ?, ?, 1, ?, ?)`).bind(url, slug, clientIP, userAgent, formattedDate).run();

        return Response.json({ 
            slug: slug, 
            link: `${origin}/${slug}`,
            length: slug.length
        }, {
            headers: corsHeaders,
            status: 200
        });
    } catch (e) {
        return Response.json({ message: e.message }, {
            headers: corsHeaders,
            status: 500
        });
    }
}
