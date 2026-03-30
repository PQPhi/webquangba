using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TanThuanDong.Domain.Entities;
using TanThuanDong.Domain.Enums;
using TanThuanDong.Infrastructure.Data;

namespace TanThuanDong.Api.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController(AppDbContext db) : ControllerBase
{
    [HttpGet("home")]
    public async Task<IActionResult> GetHome()
    {
        var featuredNews = await db.Articles
            .Where(x => x.IsPublished)
            .OrderByDescending(x => x.PublishedAt)
            .Take(4)
            .Select(x => new
            {
                x.Id,
                x.Title,
                x.Summary,
                x.ThumbnailUrl,
                x.PublishedAt,
                Category = x.Category != null ? x.Category.Name : string.Empty
            })
            .ToListAsync();

        var statistics = new
        {
            Population = 18500,
            AreaKm2 = 32.4,
            OnlineApplications = await db.Applications.CountAsync(),
            ActiveServices = await db.Services.CountAsync(x => x.IsActive)
        };

        return Ok(new
        {
            commune = "Xã Tân Thuận Đông - Thành phố Cao Lãnh - Đồng Tháp",
            bannerTitle = "Cổng thông tin quảng bá xã Tân Thuận Đông",
            featuredNews,
            serviceLinks = new[]
            {
                "Nộp hồ sơ trực tuyến",
                "Tra cứu hồ sơ",
                "Biểu mẫu hành chính",
                "Góp ý trực tuyến"
            },
            statistics
        });
    }

    [HttpGet("introduction")]
    public IActionResult GetIntroduction()
    {
        return Ok(new
        {
            history = "Tân Thuận Đông là địa phương có truyền thống phát triển nông nghiệp bền vững và chuyển dịch mạnh sang kinh tế số.",
            location = "Phía đông TP. Cao Lãnh, tỉnh Đồng Tháp",
            naturalConditions = "Địa hình bằng phẳng, hệ thống kênh rạch thuận lợi canh tác lúa và cây ăn trái.",
            populationStructure = "Dân cư phân bố tại 6 ấp, lực lượng lao động trẻ chiếm tỷ lệ cao.",
            infrastructure = "Đường giao thông nông thôn được nhựa hóa, trường học và trạm y tế đạt chuẩn."
        });
    }

    [HttpGet("news")]
    public async Task<IActionResult> GetNews([FromQuery] string? category, [FromQuery] string? keyword)
    {
        var query = db.Articles
            .Include(x => x.Category)
            .Where(x => x.IsPublished)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(x => x.Category != null && x.Category.Slug == category);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(x => x.Title.Contains(keyword) || x.Summary.Contains(keyword));
        }

        var result = await query
            .OrderByDescending(x => x.PublishedAt)
            .Select(x => new
            {
                x.Id,
                x.Title,
                x.Summary,
                x.ThumbnailUrl,
                x.PublishedAt,
                category = x.Category != null ? x.Category.Name : string.Empty
            })
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("news/{id:int}")]
    public async Task<IActionResult> GetNewsDetail(int id)
    {
        var article = await db.Articles
            .Include(x => x.Category)
            .Include(x => x.Comments)
            .FirstOrDefaultAsync(x => x.Id == id && x.IsPublished);

        if (article is null)
        {
            return NotFound(new { message = "Không tìm thấy bài viết." });
        }

        article.ViewCount += 1;
        await db.SaveChangesAsync();

        return Ok(new
        {
            article.Id,
            article.Title,
            article.Content,
            article.Summary,
            article.ThumbnailUrl,
            article.PublishedAt,
            article.ViewCount,
            category = article.Category?.Name,
            comments = article.Comments
                .Where(x => x.IsApproved)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new { x.AuthorName, x.Content, x.CreatedAt })
        });
    }

    [HttpPost("news/{id:int}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] AddCommentRequest request)
    {
        var exists = await db.Articles.AnyAsync(x => x.Id == id && x.IsPublished);
        if (!exists)
        {
            return NotFound(new { message = "Bài viết không tồn tại." });
        }

        var comment = new Comment
        {
            ArticleId = id,
            AuthorName = request.AuthorName,
            Content = request.Content,
            IsApproved = false
        };
        await db.Comments.AddAsync(comment);
        await db.SaveChangesAsync();

        return Ok(new { message = "Bình luận đã gửi, chờ duyệt." });
    }

    [HttpGet("services")]
    public async Task<IActionResult> GetServices()
    {
        var services = await db.Services
            .Where(x => x.IsActive)
            .Select(x => new
            {
                x.Id,
                x.Code,
                x.Name,
                x.Description,
                x.RequiredDocuments,
                x.ProcessingTime,
                x.Fee,
                x.FormUrl
            })
            .ToListAsync();

        return Ok(services);
    }

    [HttpPost("services/apply")]
    public async Task<IActionResult> ApplyService([FromBody] ServiceApplicationRequest request)
    {
        var serviceExists = await db.Services.AnyAsync(x => x.Id == request.ServiceProcedureId && x.IsActive);
        if (!serviceExists)
        {
            return NotFound(new { message = "Thủ tục không tồn tại." });
        }

        var record = new ApplicationRecord
        {
            ServiceProcedureId = request.ServiceProcedureId,
            ApplicantName = request.ApplicantName,
            ApplicantPhone = request.ApplicantPhone,
            ApplicantEmail = request.ApplicantEmail,
            Note = request.Note,
            Status = ApplicationStatus.New
        };

        await db.Applications.AddAsync(record);
        await db.SaveChangesAsync();

        return Ok(new { message = "Nộp hồ sơ thành công.", applicationId = record.Id });
    }

    [HttpGet("services/status/{id:int}")]
    public async Task<IActionResult> GetApplicationStatus(int id)
    {
        var application = await db.Applications
            .Include(x => x.ServiceProcedure)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (application is null)
        {
            return NotFound(new { message = "Không tìm thấy hồ sơ." });
        }

        return Ok(new
        {
            application.Id,
            service = application.ServiceProcedure?.Name,
            status = application.Status.ToString(),
            application.CreatedAt,
            application.UpdatedAt
        });
    }

    [HttpGet("media")]
    public async Task<IActionResult> GetMedia()
    {
        var media = await db.MediaItems
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new { x.Id, x.Title, x.Url, x.Type, x.Topic })
            .ToListAsync();

        return Ok(media);
    }

    [HttpPost("contact")]
    public async Task<IActionResult> Contact([FromBody] ContactRequest request)
    {
        await db.AuditLogs.AddAsync(new AuditLog
        {
            UserId = "Public",
            Action = "ContactSubmission",
            EntityName = "Contact",
            EntityId = Guid.NewGuid().ToString("N"),
            Detail = $"{request.FullName} - {request.Phone} - {request.Message}"
        });
        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "UBND xã đã nhận phản ánh/kiến nghị. Chúng tôi sẽ phản hồi sớm nhất.",
            office = "UBND xã Tân Thuận Đông, TP. Cao Lãnh, Đồng Tháp",
            phone = "0277 3 888 999",
            email = "ubnd.tanthuanadong@dongthap.gov.vn"
        });
    }

    public class AddCommentRequest
    {
        public string AuthorName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }

    public class ServiceApplicationRequest
    {
        public int ServiceProcedureId { get; set; }
        public string ApplicantName { get; set; } = string.Empty;
        public string ApplicantPhone { get; set; } = string.Empty;
        public string ApplicantEmail { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
    }

    public class ContactRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}