namespace LicenseManagement.API.DTOs
{
    // ── License ──────────────────────────────────
    public class LicenseDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string LicenseModel { get; set; } = string.Empty;
        public int Seats { get; set; }
        public decimal AnnualCost { get; set; }
        public string ComplianceStandard { get; set; } = string.Empty;
        public string LicenseKey { get; set; } = string.Empty;
        public string InternalNotes { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime ExpiryDate { get; set; }
        public string RenewalMode { get; set; } = string.Empty;
        public int AlertDaysBefore { get; set; }
        public bool IsActive { get; set; }
        public int DaysRemaining { get; set; }
        public string Status { get; set; } = string.Empty; // active, expiring, expired
        public VendorSummaryDto? Vendor { get; set; }
        public DepartmentDto? Department { get; set; }
        public List<EmployeeSummaryDto> Owners { get; set; } = new();
    }

    public class CreateLicenseDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string LicenseModel { get; set; } = string.Empty;
        public int Seats { get; set; } = 1;
        public decimal AnnualCost { get; set; }
        public string ComplianceStandard { get; set; } = string.Empty;
        public string LicenseKey { get; set; } = string.Empty;
        public string InternalNotes { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public int DurationYears { get; set; } = 1;
        public int DurationMonths { get; set; } = 0;
        public string RenewalMode { get; set; } = string.Empty;
        public int AlertDaysBefore { get; set; } = 30;
        public int? VendorId { get; set; }
        public int? DepartmentId { get; set; }
        public List<int> EmployeeIds { get; set; } = new();
    }

    public class UpdateLicenseDto : CreateLicenseDto
    {
        public bool IsActive { get; set; } = true;
    }

    // ── Vendor ──────────────────────────────────
    public class VendorDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string ContractNumber { get; set; } = string.Empty;
        public string SupportLevel { get; set; } = string.Empty;
        public string PortalUrl { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public int LicenseCount { get; set; }
    }

    public class VendorSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    public class CreateVendorDto
    {
        public string Name { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string ContractNumber { get; set; } = string.Empty;
        public string SupportLevel { get; set; } = string.Empty;
        public string PortalUrl { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
    }

    // ── Department ──────────────────────────────
    public class DepartmentDto
    {
        public int Id { get; set; }
        public string NameAr { get; set; } = string.Empty;
        public string NameEn { get; set; } = string.Empty;
        public string CostCenter { get; set; } = string.Empty;
        public int LicenseCount { get; set; }
        public decimal TotalCost { get; set; }
    }

    // ── Employee ────────────────────────────────
    public class EmployeeDto
    {
        public int Id { get; set; }
        public string NameAr { get; set; } = string.Empty;
        public string NameEn { get; set; } = string.Empty;
        public string RoleAr { get; set; } = string.Empty;
        public string RoleEn { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int? DepartmentId { get; set; }
        public string DepartmentNameAr { get; set; } = string.Empty;
    }

    public class EmployeeSummaryDto
    {
        public int Id { get; set; }
        public string NameAr { get; set; } = string.Empty;
        public string NameEn { get; set; } = string.Empty;
        public string RoleAr { get; set; } = string.Empty;
        public bool IsPrimaryOwner { get; set; }
    }

    public class CreateEmployeeDto
    {
        public string NameAr { get; set; } = string.Empty;
        public string NameEn { get; set; } = string.Empty;
        public string RoleAr { get; set; } = string.Empty;
        public string RoleEn { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int? DepartmentId { get; set; }
    }

    // ── Dashboard ───────────────────────────────
    public class DashboardDto
    {
        public int TotalLicenses { get; set; }
        public int ExpiredCount { get; set; }
        public int ExpiringCount { get; set; }
        public int ActiveCount { get; set; }
        public decimal TotalAnnualCost { get; set; }
        public double ComplianceRate { get; set; }
        public List<LicenseDto> CriticalLicenses { get; set; } = new();
        public List<DepartmentCostDto> CostByDepartment { get; set; } = new();
        public List<TypeCountDto> CountByType { get; set; } = new();
    }

    public class DepartmentCostDto
    {
        public string DepartmentAr { get; set; } = string.Empty;
        public string DepartmentEn { get; set; } = string.Empty;
        public decimal TotalCost { get; set; }
    }

    public class TypeCountDto
    {
        public string Type { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
