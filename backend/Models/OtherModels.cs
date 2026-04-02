using System.ComponentModel.DataAnnotations;

namespace LicenseManagement.API.Models
{
    public class Vendor
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(100)]
        public string Country { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(50)]
        public string Phone { get; set; } = string.Empty;

        [MaxLength(100)]
        public string ContractNumber { get; set; } = string.Empty;

        [MaxLength(50)]
        public string SupportLevel { get; set; } = string.Empty;

        [MaxLength(300)]
        public string PortalUrl { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Notes { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<License> Licenses { get; set; } = new List<License>();
    }

    public class Department
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string NameAr { get; set; } = string.Empty;

        [MaxLength(200)]
        public string NameEn { get; set; } = string.Empty;

        [MaxLength(50)]
        public string CostCenter { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public ICollection<License> Licenses { get; set; } = new List<License>();
        public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    }

    public class Employee
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string NameAr { get; set; } = string.Empty;

        [MaxLength(200)]
        public string NameEn { get; set; } = string.Empty;

        [MaxLength(200)]
        public string RoleAr { get; set; } = string.Empty;

        [MaxLength(200)]
        public string RoleEn { get; set; } = string.Empty;

        [MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        public bool IsActive { get; set; } = true;

        public int? DepartmentId { get; set; }
        public Department? Department { get; set; }

        public ICollection<LicenseAssignment> Assignments { get; set; } = new List<LicenseAssignment>();
    }

    public class LicenseAssignment
    {
        public int Id { get; set; }
        public int LicenseId { get; set; }
        public int EmployeeId { get; set; }
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
        public bool IsPrimaryOwner { get; set; } = false;

        public License? License { get; set; }
        public Employee? Employee { get; set; }
    }
}
