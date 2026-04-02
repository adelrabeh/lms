using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LicenseManagement.API.Data;
using LicenseManagement.API.DTOs;
using LicenseManagement.API.Models;
using LicenseManagement.API.Services;

namespace LicenseManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LicensesController : ControllerBase
    {
        private readonly ILicenseService _svc;
        public LicensesController(ILicenseService svc) => _svc = svc;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? type, [FromQuery] string? search)
            => Ok(await _svc.GetAllAsync(type, search));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var dto = await _svc.GetByIdAsync(id);
            return dto == null ? NotFound() : Ok(dto);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateLicenseDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var created = await _svc.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateLicenseDto dto)
        {
            var updated = await _svc.UpdateAsync(id, dto);
            return updated == null ? NotFound() : Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _svc.DeleteAsync(id);
            return ok ? NoContent() : NotFound();
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard()
            => Ok(await _svc.GetDashboardAsync());

        [HttpGet("expiring")]
        public async Task<IActionResult> Expiring([FromQuery] int days = 90)
            => Ok(await _svc.GetExpiringAsync(days));
    }

    [ApiController]
    [Route("api/[controller]")]
    public class VendorsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public VendorsController(AppDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var vendors = await _db.Vendors
                .Where(v => v.IsActive)
                .Select(v => new VendorDto
                {
                    Id = v.Id,
                    Name = v.Name,
                    Country = v.Country,
                    Email = v.Email,
                    Phone = v.Phone,
                    ContractNumber = v.ContractNumber,
                    SupportLevel = v.SupportLevel,
                    PortalUrl = v.PortalUrl,
                    Notes = v.Notes,
                    LicenseCount = v.Licenses.Count(l => l.IsActive)
                }).ToListAsync();
            return Ok(vendors);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateVendorDto dto)
        {
            var v = new Vendor
            {
                Name = dto.Name,
                Country = dto.Country,
                Email = dto.Email,
                Phone = dto.Phone,
                ContractNumber = dto.ContractNumber,
                SupportLevel = dto.SupportLevel,
                PortalUrl = dto.PortalUrl,
                Notes = dto.Notes
            };
            _db.Vendors.Add(v);
            await _db.SaveChangesAsync();
            return Ok(v);
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class DepartmentsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public DepartmentsController(AppDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var depts = await _db.Departments
                .Where(d => d.IsActive)
                .Select(d => new DepartmentDto
                {
                    Id = d.Id,
                    NameAr = d.NameAr,
                    NameEn = d.NameEn,
                    CostCenter = d.CostCenter,
                    LicenseCount = d.Licenses.Count(l => l.IsActive),
                    TotalCost = d.Licenses.Where(l => l.IsActive).Sum(l => l.AnnualCost)
                }).ToListAsync();
            return Ok(depts);
        }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly AppDbContext _db;
        public EmployeesController(AppDbContext db) => _db = db;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? departmentId)
        {
            var q = _db.Employees
                .Include(e => e.Department)
                .Where(e => e.IsActive);

            if (departmentId.HasValue)
                q = q.Where(e => e.DepartmentId == departmentId);

            var emps = await q.Select(e => new EmployeeDto
            {
                Id = e.Id,
                NameAr = e.NameAr,
                NameEn = e.NameEn,
                RoleAr = e.RoleAr,
                RoleEn = e.RoleEn,
                Email = e.Email,
                DepartmentId = e.DepartmentId,
                DepartmentNameAr = e.Department != null ? e.Department.NameAr : ""
            }).ToListAsync();

            return Ok(emps);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEmployeeDto dto)
        {
            var emp = new Employee
            {
                NameAr = dto.NameAr,
                NameEn = dto.NameEn,
                RoleAr = dto.RoleAr,
                RoleEn = dto.RoleEn,
                Email = dto.Email,
                DepartmentId = dto.DepartmentId
            };
            _db.Employees.Add(emp);
            await _db.SaveChangesAsync();
            return Ok(emp);
        }
    }
}
