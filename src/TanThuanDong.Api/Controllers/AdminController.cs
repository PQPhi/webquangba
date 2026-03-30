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
        var totalViews = await db.Articles.SumAsync(x => x.ViewCount);
        var monthlyApplications = await db.Applications
            .Where(x => x.CreatedAt >= DateTime.UtcNow.AddMonths(-6))
            .GroupBy(x => new { x.CreatedAt.Year, x.CreatedAt.Month })
            .Select(g => new
            {
                month = $"{g.Key.Month:D2}/{g.Key.Year}",
                value = g.Count()
            })
            .OrderBy(x => x.month)
            .ToListAsync();

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
}