using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TanThuanDong.Domain.Constants;
using TanThuanDong.Domain.Entities;
using TanThuanDong.Domain.Enums;
using TanThuanDong.Infrastructure.Data;

namespace TanThuanDong.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
public class AdminController(
    AppDbContext db,
    UserManager<AppUser> userManager) : ControllerBase
{
    [HttpGet("dashboard")]
    [Authorize(Roles = $"{SystemRoles.Admin},{SystemRoles.Editor},{SystemRoles.Viewer}")]
    public async Task<IActionResult> Dashboard()
    {
        var totalViews = await db.Articles
            .Select(x => (int?)x.ViewCount)
            .SumAsync() ?? 0;

        var monthlyApplicationsRaw = await db.Applications
            .Where(x => x.CreatedAt >= DateTime.UtcNow.AddMonths(-6))
            .GroupBy(x => new { x.CreatedAt.Year, x.CreatedAt.Month })
            .Select(g => new
            {
                g.Key.Year,
                g.Key.Month,
                value = g.Count()
            })
            .OrderBy(x => x.Year)
            .ThenBy(x => x.Month)
            .ToListAsync();

        var monthlyApplications = monthlyApplicationsRaw
            .Select(x => new
            {
                month = $"{x.Month:D2}/{x.Year}",
                x.value
            })
            .ToList();

        return Ok(new
        {
            totalUsers = await db.Users.CountAsync(),
            totalArticles = await db.Articles.CountAsync(),
            totalServices = await db.Services.CountAsync(),
            totalApplications = await db.Applications.CountAsync(),
            totalViews,
            monthlyApplications
        });
    }

    [HttpGet("users")]
    [Authorize(Roles = SystemRoles.Admin)]
    public async Task<IActionResult> GetUsers()
    {
        var users = await db.Users.OrderByDescending(x => x.CreatedAt).ToListAsync();
        var result = new List<object>();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            result.Add(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.PhoneNumber,
                user.IsActive,
                Roles = roles,
                user.CreatedAt
            });
        }

        return Ok(result);
    }

    [HttpPost("users")]
    [Authorize(Roles = SystemRoles.Admin)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            EmailConfirmed = true,
            IsActive = true
        };

        var created = await userManager.CreateAsync(user, request.Password);
        if (!created.Succeeded)
        {
            return BadRequest(new { errors = created.Errors.Select(x => x.Description) });
        }

        if (!SystemRoles.All.Contains(request.Role))
        {
            return BadRequest(new { message = "Role không hợp lệ." });
        }

        await userManager.AddToRoleAsync(user, request.Role);
        return Ok(new { message = "Tạo tài khoản thành công." });
    }

    [HttpPatch("users/{id}/active")]
    [Authorize(Roles = SystemRoles.Admin)]
    public async Task<IActionResult> UpdateUserActiveStatus(string id, [FromBody] UpdateUserActiveRequest request)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound(new { message = "Không tìm thấy người dùng." });
        }

        user.IsActive = request.IsActive;
        await userManager.UpdateAsync(user);

        return Ok(new { message = "Cập nhật trạng thái người dùng thành công." });
    }

    [HttpPatch("applications/{id:int}/status")]
    [Authorize(Roles = $"{SystemRoles.Admin},{SystemRoles.Editor}")]
    public async Task<IActionResult> UpdateApplicationStatus(int id, [FromBody] UpdateApplicationStatusRequest request)
    {
        var app = await db.Applications.FirstOrDefaultAsync(x => x.Id == id);
        if (app is null)
        {
            return NotFound(new { message = "Không tìm thấy hồ sơ." });
        }

        app.Status = request.Status;
        app.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Ok(new { message = "Cập nhật trạng thái thành công." });
    }

    [HttpGet("applications")]
    [Authorize(Roles = $"{SystemRoles.Admin},{SystemRoles.Editor},{SystemRoles.Viewer}")]
    public async Task<IActionResult> GetApplications()
    {
        var items = await db.Applications
            .Include(x => x.ServiceProcedure)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.ApplicantName,
                x.ApplicantPhone,
                x.ApplicantEmail,
                x.Status,
                serviceName = x.ServiceProcedure != null ? x.ServiceProcedure.Name : string.Empty,
                x.CreatedAt,
                x.UpdatedAt
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("articles")]
    [Authorize(Roles = $"{SystemRoles.Admin},{SystemRoles.Editor},{SystemRoles.Viewer}")]
    public async Task<IActionResult> GetArticles()
    {
        var items = await db.Articles
            .Include(x => x.Category)
            .OrderByDescending(x => x.PublishedAt)
            .Select(x => new
            {
                x.Id,
                x.Title,
                x.Summary,
                x.ThumbnailUrl,
                x.IsPublished,
                x.PublishedAt,
                x.CreatedBy,
                categoryId = x.CategoryId,
                categoryName = x.Category != null ? x.Category.Name : string.Empty
            })
            .ToListAsync();

        return Ok(items);
    }

    [HttpPost("articles")]
    [Authorize(Roles = $"{SystemRoles.Admin},{SystemRoles.Editor}")]
    public async Task<IActionResult> CreateArticle([FromBody] CreateArticleRequest request)
    {
        var categoryExists = await db.Categories.AnyAsync(x => x.Id == request.CategoryId);
        if (!categoryExists)
        {
            return BadRequest(new { message = "Danh mục không hợp lệ." });
        }

        var article = new Article
        {
            CategoryId = request.CategoryId,
            Title = request.Title,
            Summary = request.Summary,
            Content = request.Content,
            ThumbnailUrl = request.ThumbnailUrl,
            IsPublished = request.IsPublished,
            PublishedAt = DateTime.UtcNow,
            CreatedBy = User.Identity?.Name ?? "admin"
        };

        await db.Articles.AddAsync(article);
        await db.SaveChangesAsync();

        return Ok(new { message = "Đăng bài thành công." });
    }

    [HttpPatch("articles/{id:int}/publish")]
    [Authorize(Roles = $"{SystemRoles.Admin},{SystemRoles.Editor}")]
    public async Task<IActionResult> UpdateArticlePublishStatus(int id, [FromBody] UpdateArticlePublishRequest request)
    {
        var article = await db.Articles.FirstOrDefaultAsync(x => x.Id == id);
        if (article is null)
        {
            return NotFound(new { message = "Không tìm thấy bài viết." });
        }

        article.IsPublished = request.IsPublished;
        if (request.IsPublished)
        {
            article.PublishedAt = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return Ok(new { message = "Cập nhật trạng thái bài viết thành công." });
    }

    [HttpGet("categories")]
    [Authorize(Roles = $"{SystemRoles.Admin},{SystemRoles.Editor},{SystemRoles.Viewer}")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await db.Categories
            .OrderBy(x => x.Name)
            .Select(x => new { x.Id, x.Name, x.Slug })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpPost("categories")]
    [Authorize(Roles = $"{SystemRoles.Admin},{SystemRoles.Editor}")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        var slug = string.IsNullOrWhiteSpace(request.Slug)
            ? request.Name.Trim().ToLowerInvariant().Replace(" ", "-")
            : request.Slug.Trim().ToLowerInvariant();

        var exists = await db.Categories.AnyAsync(x => x.Slug == slug);
        if (exists)
        {
            return BadRequest(new { message = "Slug danh mục đã tồn tại." });
        }

        var category = new Category
        {
            Name = request.Name.Trim(),
            Slug = slug,
            Description = request.Description.Trim()
        };

        await db.Categories.AddAsync(category);
        await db.SaveChangesAsync();

        return Ok(new { message = "Tạo danh mục thành công.", category.Id, category.Name, category.Slug });
    }

    [HttpGet("comments")]
    [Authorize(Roles = $"{SystemRoles.Admin},{SystemRoles.Editor}")]
    public async Task<IActionResult> GetComments()
    {
        var comments = await db.Comments
            .Include(x => x.Article)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new
            {
                x.Id,
                x.AuthorName,
                x.Content,
                x.IsApproved,
                articleTitle = x.Article != null ? x.Article.Title : string.Empty,
                x.CreatedAt
            })
            .ToListAsync();

        return Ok(comments);
    }

    [HttpPatch("comments/{id:int}/approve")]
    [Authorize(Roles = $"{SystemRoles.Admin},{SystemRoles.Editor}")]
    public async Task<IActionResult> ApproveComment(int id)
    {
        var comment = await db.Comments.FirstOrDefaultAsync(x => x.Id == id);
        if (comment is null)
        {
            return NotFound();
        }

        comment.IsApproved = true;
        await db.SaveChangesAsync();
        return Ok(new { message = "Đã duyệt bình luận." });
    }

    public class CreateUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = SystemRoles.Viewer;
    }

    public class UpdateApplicationStatusRequest
    {
        public ApplicationStatus Status { get; set; } = ApplicationStatus.Processing;
    }

    public class UpdateUserActiveRequest
    {
        public bool IsActive { get; set; }
    }

    public class CreateArticleRequest
    {
        public int CategoryId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string ThumbnailUrl { get; set; } = string.Empty;
        public bool IsPublished { get; set; } = true;
    }

    public class UpdateArticlePublishRequest
    {
        public bool IsPublished { get; set; }
    }

    public class CreateCategoryRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}