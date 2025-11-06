// netlify/functions/get-user-id.js

// ئەمە کۆدی بێ-سێرڤەرە (Node.js) کە لەسەر سێرڤەری Netlify کار دەکات.

exports.handler = async (event, context) => {
    
    // ******* بەشی پاراستنی زۆر گرنگ *******
    
    // ١. پشکنینی لۆگین: ئایا یوزەرێک لۆگینی کردووە؟
    if (!context.clientContext || !context.clientContext.user) {
        // ئەگەر لۆگینی نەکردبێت، ٤٠١ (ڕێگە پێنەدراو) دەگەڕێنێتەوە.
        return {
            statusCode: 401, 
            body: JSON.stringify({ message: "تکایە لۆگین بکە بۆ گەیشتن بەم داتایە." })
        };
    }
    
    // ٢. وەرگرتنی ئایدیی پارێزراو: Netlify خۆی ئەم زانیارییە دابین دەکات
    const user_id = context.clientContext.user.sub; // IDـی ناوازەی یوزەر
    const user_email = context.clientContext.user.email;
    
    // ******* کۆتایی بەشی پاراستن *******
    
    // ٣. ناردنەوەی وەڵامی سەرکەوتوو (٢٠٠)
    return {
        statusCode: 200, 
        body: JSON.stringify({
            message: "سەرکەوتوو بوو. ئەمە IDـی تایبەتە بۆ جیاکردنەوەی داتاکانت:",
            user_id: user_id, // ئەمە کلیلی جیاکردنەوەی داتایە لە Neon
            email: user_email
        })
    };
};