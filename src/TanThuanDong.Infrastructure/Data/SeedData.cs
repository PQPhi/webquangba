using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TanThuanDong.Domain.Constants;
using TanThuanDong.Domain.Entities;

namespace TanThuanDong.Infrastructure.Data;

public static class SeedData
{
    public static async Task InitializeAsync(
        AppDbContext db,
        RoleManager<IdentityRole> roleManager,
        UserManager<AppUser> userManager)
    {
        await db.Database.EnsureCreatedAsync();

        foreach (var role in SystemRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        const string adminEmail = "admin@tanthuanadong.gov.vn";
        var admin = await userManager.FindByEmailAsync(adminEmail);
        if (admin is null)
        {
            admin = new AppUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Quản trị hệ thống",
                PhoneNumber = "0909000000",
                EmailConfirmed = true,
                IsActive = true
            };
            await userManager.CreateAsync(admin, "Admin@123");
            await userManager.AddToRoleAsync(admin, SystemRoles.Admin);
        }

        if (!await db.Categories.AnyAsync())
        {
            var categories = new[]
            {
                new Category { Name = "Kinh tế", Slug = "kinh-te", Description = "Thông tin phát triển kinh tế địa phương" },
                new Category { Name = "Văn hóa - Xã hội", Slug = "van-hoa-xa-hoi", Description = "Hoạt động văn hóa, giáo dục, y tế" },
                new Category { Name = "Thông báo", Slug = "thong-bao", Description = "Thông báo hành chính và lịch công tác" }
            };

            await db.Categories.AddRangeAsync(categories);
            await db.SaveChangesAsync();
        }

        if (!await db.Articles.AnyAsync())
        {
            var category = await db.Categories.FirstAsync();
            await db.Articles.AddRangeAsync(
                new Article
                {
                    CategoryId = category.Id,
                    Title = "Xã Tân Thuận Đông đẩy mạnh chuyển đổi số cộng đồng",
                    Summary = "Nhiều tổ công nghệ số cộng đồng hỗ trợ người dân thực hiện dịch vụ công trực tuyến mức độ cao.",
                    Content = "UBND xã Tân Thuận Đông phối hợp đoàn thể triển khai tập huấn kỹ năng số cho người dân và doanh nghiệp nhỏ.",
                    ThumbnailUrl = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
                    CreatedBy = adminEmail,
                    IsPublished = true,
                    PublishedAt = DateTime.UtcNow.AddDays(-3)
                },
                new Article
                {
                    CategoryId = category.Id,
                    Title = "Nâng cấp tuyến đường nông thôn kết nối các ấp",
                    Summary = "Dự án nâng cấp hạ tầng giao thông góp phần thúc đẩy thương mại nông sản.",
                    Content = "Tuyến đường mới tạo điều kiện vận chuyển thuận lợi cho bà con và học sinh đến trường an toàn.",
                    ThumbnailUrl = "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?auto=format&fit=crop&w=1200&q=80",
                    CreatedBy = adminEmail,
                    IsPublished = true,
                    PublishedAt = DateTime.UtcNow.AddDays(-1)
                });
            await db.SaveChangesAsync();
        }

        if (!await db.Services.AnyAsync())
        {
            await db.Services.AddRangeAsync(
                new ServiceProcedure
                {
                    Code = "TTHC-001",
                    Name = "Xác nhận tình trạng hôn nhân",
                    Description = "Cấp giấy xác nhận tình trạng hôn nhân cho công dân cư trú tại xã.",
                    RequiredDocuments = "CCCD/CMND, tờ khai theo mẫu.",
                    ProcessingTime = "03 ngày làm việc",
                    Fee = "Miễn phí",
                    FormUrl = "https://example.com/forms/tinh-trang-hon-nhan.pdf",
                    IsActive = true
                },
                new ServiceProcedure
                {
                    Code = "TTHC-002",
                    Name = "Chứng thực bản sao từ bản chính",
                    Description = "Chứng thực bản sao giấy tờ theo quy định hiện hành.",
                    RequiredDocuments = "Bản chính giấy tờ, bản sao cần chứng thực.",
                    ProcessingTime = "Trong ngày",
                    Fee = "2.000 VNĐ/trang",
                    FormUrl = "https://example.com/forms/chung-thuc-ban-sao.pdf",
                    IsActive = true
                });
            await db.SaveChangesAsync();
        }

        if (!await db.MediaItems.AnyAsync())
        {
            await db.MediaItems.AddRangeAsync(
                new Media
                {
                    Title = "Toàn cảnh cánh đồng lúa Tân Thuận Đông",
                    Url = "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
                    Type = "Image",
                    Topic = "Nông nghiệp"
                },
                new Media
                {
                    Title = "Trung tâm hành chính xã",
                    Url = "https://images.unsplash.com/photo-1475724017904-b712052c192a?auto=format&fit=crop&w=1200&q=80",
                    Type = "Image",
                    Topic = "Hạ tầng"
                },
                new Media
                {
                    Title = "Video giới thiệu xã Tân Thuận Đông",
                    Url = "https://www.youtube.com/embed/aqz-KE-bpKQ",
                    Type = "Video",
                    Topic = "Giới thiệu"
                });
            await db.SaveChangesAsync();
        }
    }
}