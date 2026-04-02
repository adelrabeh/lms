using Microsoft.EntityFrameworkCore;
using LicenseManagement.API.Data;
using LicenseManagement.API.DTOs;
using LicenseManagement.API.Models;

namespace LicenseManagement.API.Services
{
    public interface ILicenseService
    {
        Task<List<LicenseDto>> GetAllAsync(string? type = null, string? search = null);
        Task<LicenseDto?> GetByIdAsync(int id);
        Task<LicenseDto> CreateAsync(CreateLicenseDto dto);
        Task<LicenseDto?> UpdateAsync(int id, UpdateLicenseDto dto);
        Task<bool> DeleteAsync(int id);
        Task<DashboardDto> GetDashboardAsync();
        Task<List<LicenseDto>> GetExpiringAsync(int days = 90);
    }

    public class LicenseService : ILicenseService
    {
        private readonly AppDbContext _db;
        public LicenseService(AppDbContext db) => _db = db;

        private static string CalcStatus(DateTime expiry)
        {
            var days = (expiry.Date - DateTime.UtcNow.Date).Days;
            if (days < 0) return "expired";
            if (days <= 30) return "expiring_soon";
            if (days <= 90) return "needs_renewal";
            return "active";
        }

        private LicenseDto MapDto(License l) => new LicenseDto
        {
            Id = l.Id,
            Name = l.Name,
            Description = l.Description,
            Type = l.Type,
            LicenseModel = l.LicenseModel,
            Seats = l.Seats,
            AnnualCost = l.AnnualCost,
            ComplianceStandard = l.ComplianceStandard,
            LicenseKey = l.LicenseKey,
            InternalNotes = l.InternalNotes,
            StartDate = l.StartDate,
            ExpiryDate = l.ExpiryDate,
            RenewalMode = l.RenewalMode,
            AlertDaysBefore = l.AlertDaysBefore,
            IsActive = l.IsActive,
            DaysRemaining = (int)(l.ExpiryDate.Date - DateTime.UtcNow.Date).TotalDays,
            Status = CalcStatus(l.ExpiryDate),
            Vendor = l.Vendor == null ? null : new VendorSummaryDto
            {
                Id = l.Vendor.Id, Name = l.Vendor.Name,
                Country = l.Vendor.Country, Email = l.Vendor.Email
            },
            Department = l.Department == null ? null : new DepartmentDto
            {
                Id = l.Department.Id, NameAr = l.Department.NameAr,
                NameEn = l.Department.NameEn, CostCenter = l.Department.CostCenter
            },
            Owners = l.Assignments.Select(a => new EmployeeSummaryDto
            {
                Id = a.Employee!.Id, NameAr = a.Employee.NameAr,
                NameEn = a.Employee.NameEn, RoleAr = a.Employee.RoleAr,
                IsPrimaryOwner = a.IsPrimaryOwner
            }).ToList()
        };

        private IQueryable<License> BaseQuery() =>
            _db.Licenses
                .Include(l => l.Vendor)
                .Include(l => l.Department)
                .Include(l => l.Assignments).ThenInclude(a => a.Employee);

        public async Task<List<LicenseDto>> GetAllAsync(string? type = null, string? search = null)
        {
            var q = BaseQuery().Where(l => l.IsActive);
            if (!string.IsNullOrEmpty(type)) q = q.Where(l => l.Type == type);
            if (!string.IsNullOrEmpty(search))
                q = q.Where(l => l.Name.Contains(search) || (l.Vendor != null && l.Vendor.Name.Contains(search)));
            return (await q.OrderBy(l => l.ExpiryDate).ToListAsync()).Select(MapDto).ToList();
        }

        public async Task<LicenseDto?> GetByIdAsync(int id)
        {
            var l = await BaseQuery().FirstOrDefaultAsync(x => x.Id == id);
            return l == null ? null : MapDto(l);
        }

        public async Task<LicenseDto> CreateAsync(CreateLicenseDto dto)
        {
            // Parse startDate as UTC
            var startDate = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc);
            var expiry = startDate.AddYears(dto.DurationYears).AddMonths(dto.DurationMonths);

            var license = new License
            {
                Name = dto.Name,
                Description = dto.Description,
                Type = dto.Type,
                LicenseModel = dto.LicenseModel,
                Seats = dto.Seats,
                AnnualCost = dto.AnnualCost,
                ComplianceStandard = dto.ComplianceStandard,
                LicenseKey = dto.LicenseKey,
                InternalNotes = dto.InternalNotes,
                StartDate = startDate,
                ExpiryDate = expiry,
                RenewalMode = dto.RenewalMode,
                AlertDaysBefore = dto.AlertDaysBefore,
                VendorId = dto.VendorId,
                DepartmentId = dto.DepartmentId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Licenses.Add(license);
            await _db.SaveChangesAsync();

            foreach (var empId in dto.EmployeeIds)
                _db.LicenseAssignments.Add(new LicenseAssignment
                {
                    LicenseId = license.Id,
                    EmployeeId = empId,
                    IsPrimaryOwner = dto.EmployeeIds.IndexOf(empId) == 0
                });

            await _db.SaveChangesAsync();
            return MapDto((await BaseQuery().FirstAsync(x => x.Id == license.Id)));
        }

        public async Task<LicenseDto?> UpdateAsync(int id, UpdateLicenseDto dto)
        {
            var license = await _db.Licenses.FindAsync(id);
            if (license == null) return null;

            var startDate = DateTime.SpecifyKind(dto.StartDate, DateTimeKind.Utc);
            license.Name = dto.Name; license.Description = dto.Description;
            license.Type = dto.Type; license.LicenseModel = dto.LicenseModel;
            license.Seats = dto.Seats; license.AnnualCost = dto.AnnualCost;
            license.ComplianceStandard = dto.ComplianceStandard;
            license.LicenseKey = dto.LicenseKey; license.InternalNotes = dto.InternalNotes;
            license.StartDate = startDate;
            license.ExpiryDate = startDate.AddYears(dto.DurationYears).AddMonths(dto.DurationMonths);
            license.RenewalMode = dto.RenewalMode; license.AlertDaysBefore = dto.AlertDaysBefore;
            license.VendorId = dto.VendorId; license.DepartmentId = dto.DepartmentId;
            license.IsActive = dto.IsActive; license.UpdatedAt = DateTime.UtcNow;

            var existing = _db.LicenseAssignments.Where(a => a.LicenseId == id);
            _db.LicenseAssignments.RemoveRange(existing);
            foreach (var empId in dto.EmployeeIds)
                _db.LicenseAssignments.Add(new LicenseAssignment
                {
                    LicenseId = id, EmployeeId = empId,
                    IsPrimaryOwner = dto.EmployeeIds.IndexOf(empId) == 0
                });

            await _db.SaveChangesAsync();
            return MapDto((await BaseQuery().FirstAsync(x => x.Id == id)));
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var l = await _db.Licenses.FindAsync(id);
            if (l == null) return false;
            l.IsActive = false;
            l.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<List<LicenseDto>> GetExpiringAsync(int days = 90)
        {
            var cutoff = DateTime.UtcNow.AddDays(days);
            var q = BaseQuery().Where(l => l.IsActive && l.ExpiryDate <= cutoff);
            return (await q.OrderBy(l => l.ExpiryDate).ToListAsync()).Select(MapDto).ToList();
        }

        public async Task<DashboardDto> GetDashboardAsync()
        {
            var all = await BaseQuery().Where(l => l.IsActive).ToListAsync();
            var dtos = all.Select(MapDto).ToList();

            var costByDept = await _db.Licenses
                .Where(l => l.IsActive && l.Department != null)
                .GroupBy(l => new { l.Department!.NameAr, l.Department.NameEn })
                .Select(g => new DepartmentCostDto
                {
                    DepartmentAr = g.Key.NameAr, DepartmentEn = g.Key.NameEn,
                    TotalCost = g.Sum(l => l.AnnualCost)
                }).ToListAsync();

            var countByType = await _db.Licenses
                .Where(l => l.IsActive)
                .GroupBy(l => l.Type)
                .Select(g => new TypeCountDto { Type = g.Key, Count = g.Count() })
                .ToListAsync();

            int compliant = all.Count(l => !string.IsNullOrEmpty(l.ComplianceStandard) && l.ComplianceStandard != "—");

            return new DashboardDto
            {
                TotalLicenses = all.Count,
                ExpiredCount = dtos.Count(d => d.Status == "expired"),
                ExpiringCount = dtos.Count(d => d.Status == "expiring_soon"),
                ActiveCount = dtos.Count(d => d.Status == "active"),
                TotalAnnualCost = all.Sum(l => l.AnnualCost),
                ComplianceRate = all.Count > 0 ? Math.Round((double)compliant / all.Count * 100, 1) : 0,
                CriticalLicenses = dtos.Where(d => d.DaysRemaining < 90).OrderBy(d => d.DaysRemaining).Take(10).ToList(),
                CostByDepartment = costByDept,
                CountByType = countByType
            };
        }
    }
}
