/**
 * @param {string} slug
 */
import page404 from './404.html'

export async function onRequestGet(context) {
    const { request, env, params } = context;
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("clientIP");
    const userAgent = request.headers.get("user-agent");
    const Referer = request.headers.get('Referer') || "Referer"
    const originurl = new URL(request.url);
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

    const slug = params.id;

    const linkData = await env.DB.prepare(`SELECT url, expire_time FROM links where slug = ?`).bind(slug).first()

    if (!linkData) {
        return new Response(page404, {
            status: 404,
            headers: {
                "content-type": "text/html;charset=UTF-8",
            }
        });
    }

    // 检查是否过期
    if (linkData.expire_time) {
        const now = new Date();
        const expireTime = new Date(linkData.expire_time);
        if (now > expireTime) {
            return new Response(page404, {
                status: 410,  // 410 Gone 表示资源已过期
                headers: {
                    "content-type": "text/html;charset=UTF-8",
                }
            });
        }
    }

    // 未过期或永久有效，继续跳转
    try {
        const info = await env.DB.prepare(`INSERT INTO logs (url, slug, ip, referer, ua, create_time) 
        VALUES (?, ?, ?, ?, ?, ?)`).bind(linkData.url, slug, clientIP, Referer, userAgent, formattedDate).run()
        
        return Response.redirect(linkData.url, 302);
    } catch (error) {
        console.log(error);
        return Response.redirect(linkData.url, 302);
    }
}
