using System.Net;
using System.Text.Json;

namespace TanThuanDong.Api.Middlewares;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task Invoke(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var payload = JsonSerializer.Serialize(new
            {
                message = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
                detail = ex.Message
            });

            await context.Response.WriteAsync(payload);
        }
    }
}