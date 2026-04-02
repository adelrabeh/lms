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

// PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);

builder.Services.AddScoped<ILicenseService, LicenseService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000",
                builder.Configuration["Frontend:Url"] ?? "*"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
    );
});

var app = builder.Build();

// Auto-migrate on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => new { status = "ok", time = DateTime.UtcNow });

app.Run();
