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

            // License → Vendor (optional)
            modelBuilder.Entity<License>()
                .HasOne(l => l.Vendor)
                .WithMany(v => v.Licenses)
                .HasForeignKey(l => l.VendorId)
                .OnDelete(DeleteBehavior.SetNull);

            // License → Department (optional)
            modelBuilder.Entity<License>()
                .HasOne(l => l.Department)
                .WithMany(d => d.Licenses)
                .HasForeignKey(l => l.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // Employee → Department
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Department)
                .WithMany(d => d.Employees)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // LicenseAssignment composite
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

            // Seed Departments
            modelBuilder.Entity<Department>().HasData(
                new Department { Id = 1, NameAr = "تقنية المعلومات", NameEn = "Information Technology", CostCenter = "CC-101" },
                new Department { Id = 2, NameAr = "التحول الرقمي", NameEn = "Digital Transformation", CostCenter = "CC-102" },
                new Department { Id = 3, NameAr = "مكتب البيانات", NameEn = "Data Office", CostCenter = "CC-103" },
                new Department { Id = 4, NameAr = "الموارد البشرية", NameEn = "Human Resources", CostCenter = "CC-201" }
            );

            // Seed Vendors
            modelBuilder.Entity<Vendor>().HasData(
                new Vendor { Id = 1, Name = "Microsoft", Country = "United States", Email = "licensing@microsoft.com", SupportLevel = "Premium 24/7" },
                new Vendor { Id = 2, Name = "Oracle", Country = "United States", Email = "oracle-sa@oracle.com", SupportLevel = "Business Hours" },
                new Vendor { Id = 3, Name = "VMware", Country = "United States", Email = "vmware@broadcom.com", SupportLevel = "Business Hours" },
                new Vendor { Id = 4, Name = "Cisco", Country = "United States", Email = "cisco-ksa@cisco.com", SupportLevel = "Premium 24/7" },
                new Vendor { Id = 5, Name = "Adobe", Country = "United States", Email = "adobe-ent@adobe.com", SupportLevel = "Online Only" }
            );
        }
    }
}
