using Microsoft.EntityFrameworkCore;
using LicenseManagement.API.Models;

namespace LicenseManagement.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<License> Licenses { get; set; }
        public DbSet<Vendor> Vendors { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<LicenseAssignment> LicenseAssignments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<License>()
                .HasOne(l => l.Vendor)
                .WithMany(v => v.Licenses)
                .HasForeignKey(l => l.VendorId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<License>()
                .HasOne(l => l.Department)
                .WithMany(d => d.Licenses)
                .HasForeignKey(l => l.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<LicenseAssignment>()
                .HasOne(a => a.License)
                .WithMany(l => l.Assignments)
                .HasForeignKey(a => a.LicenseId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LicenseAssignment>()
                .HasOne(a => a.Employee)
                .WithMany(e => e.Assignments)
                .HasForeignKey(a => a.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
