using TanThuanDong.Domain.Enums;

namespace TanThuanDong.Domain.Entities;

public class ApplicationRecord
{
    public int Id { get; set; }
    public int ServiceProcedureId { get; set; }
    public ServiceProcedure? ServiceProcedure { get; set; }
    public string ApplicantName { get; set; } = string.Empty;
    public string ApplicantPhone { get; set; } = string.Empty;
    public string ApplicantEmail { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public ApplicationStatus Status { get; set; } = ApplicationStatus.New;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}