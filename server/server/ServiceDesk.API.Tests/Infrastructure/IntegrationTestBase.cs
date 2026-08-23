namespace ServiceDesk.API.Tests.Infrastructure;

public abstract class IntegrationTestBase : IAsyncLifetime
{
    protected ServiceDeskWebApplicationFactory Factory { get; }
    protected HttpClient Client { get; private set; } = null!; // null-forgiving

    protected IntegrationTestBase(ServiceDeskWebApplicationFactory factory)
    {
        Factory = factory;
    }

    public virtual async Task InitializeAsync()
    {
        await ResetDatabaseAsync();
        await TestDataSeeder.EnsureDefaultRolesAsync(Factory);
        Client = Factory.CreateClient(new()
        {
            AllowAutoRedirect = false
        });
    }

    public virtual Task DisposeAsync()
    {
        Client.Dispose();
        return Task.CompletedTask;
    }

    protected void SetBearerToken(string token)
    {
        Client.SetBearerToken(token);
    }

    protected Task ResetDatabaseAsync()
    {
        return Factory.ResetDatabaseAsync();
    }
}
