namespace TanThuanDong.Domain.Entities;

public class ServiceProcedure
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string RequiredDocuments { get; set; } = string.Empty;
    public string ProcessingTime { get; set; } = string.Empty;
    public string Fee { get; set; } = string.Empty;
    public string FormUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<ApplicationRecord> Applications { get; set; } = new List<ApplicationRecord>();
}