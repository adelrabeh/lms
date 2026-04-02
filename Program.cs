using Microsoft.EntityFrameworkCore;
using LicenseManagement.API.Data;
using LicenseManagement.API.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "License Management API", Version = "v1" });
});

var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DATABASE_URL not found.");

string connStr;
if (databaseUrl.StartsWith("postgresql://") || databaseUrl.StartsWith("postgres://"))
{
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    connStr = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={Uri.UnescapeDataString(userInfo[1])};SSL Mode=Require;Trust Server Certificate=true";
}
else
{
    connStr = databaseUrl;
}

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connStr));
builder.Services.AddScoped<ILicenseService, LicenseService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
                "http://localhost:5173", "http://localhost:3000",
                Environment.GetEnvironmentVariable("FRONTEND_URL") ?? "*")
            .AllowAnyHeader().AllowAnyMethod()
    );
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.EnsureCreated();
        if (!db.Departments.Any())
        {
            db.Departments.AddRange(
                new LicenseManagement.API.Models.Department { NameAr = "تقنية المعلومات", NameEn = "Information Technology", CostCenter = "CC-101", IsActive = true },
                new LicenseManagement.API.Models.Department { NameAr = "التحول الرقمي", NameEn = "Digital Transformation", CostCenter = "CC-102", IsActive = true },
                new LicenseManagement.API.Models.Department { NameAr = "مكتب البيانات", NameEn = "Data Office", CostCenter = "CC-103", IsActive = true },
                new LicenseManagement.API.Models.Department { NameAr = "الموارد البشرية", NameEn = "Human Resources", CostCenter = "CC-201", IsActive = true }
            );
            db.SaveChanges();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"DB init error: {ex.Message}");
    }
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.MapGet("/health", () => new { status = "ok", time = DateTime.UtcNow });

app.MapGet("/dbtest", async (AppDbContext db) => {
    try {
        var canConnect = await db.Database.CanConnectAsync();
        db.Database.EnsureCreated();
        var depts = db.Departments.Count();
        var conn = db.Database.GetConnectionString() ?? "";
        return Results.Ok(new { 
            canConnect, 
            depts, 
            host = conn.Length > 40 ? conn.Substring(0, 40) : conn
        });
    } catch (Exception ex) {
        return Results.Ok(new { 
            error = ex.Message, 
            inner = ex.InnerException?.Message ?? "none"
        });
    }
});

app.Run();
