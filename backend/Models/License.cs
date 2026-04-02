using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LicenseManagement.API.Models
{
    public class License
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string Type { get; set; } = string.Empty; // sw, saas, hw

        [MaxLength(50)]
        public string LicenseModel { get; set; } = string.Empty; // Per User, Per Device, etc.

        public int Seats { get; set; } = 1;

        [Column(TypeName = "decimal(18,2)")]
        public decimal AnnualCost { get; set; }

        [MaxLength(100)]
        public string ComplianceStandard { get; set; } = string.Empty;

        [MaxLength(200)]
        public string LicenseKey { get; set; } = string.Empty;

        [MaxLength(500)]
        public string InternalNotes { get; set; } = string.Empty;

        public DateTime StartDate { get; set; }
        public DateTime ExpiryDate { get; set; }

        [MaxLength(50)]
        public string RenewalMode { get; set; } = string.Empty; // Auto, Manual, Non-renewable

        public int AlertDaysBefore { get; set; } = 30;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Foreign Keys
        public int? VendorId { get; set; }
        public int? DepartmentId { get; set; }

        // Navigation
        public Vendor? Vendor { get; set; }
        public Department? Department { get; set; }
        public ICollection<LicenseAssignment> Assignments { get; set; } = new List<LicenseAssignment>();
    }
}
