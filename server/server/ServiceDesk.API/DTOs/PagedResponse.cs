namespace ServiceDesk.API.DTOs;

public sealed class PagedResponse<T>
{
    public PagedResponse(IEnumerable<T> items, int page, int pageSize, int total)
    {
        Items = items.ToList();
        Page = page;
        PageSize = pageSize;
        Total = total;
    }

    public IReadOnlyList<T> Items { get; }
    public int Page { get; }
    public int PageSize { get; }
    public int Total { get; }
}
