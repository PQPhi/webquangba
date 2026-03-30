using TanThuanDong.Domain.Entities;

namespace TanThuanDong.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(AppUser user, IList<string> roles);
}