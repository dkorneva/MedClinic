# ServiceDesk API Architecture

## Active runtime layers

- `Controllers`
  Thin HTTP entrypoints. They should only handle transport concerns.
- `Application/Abstractions`
  Contracts for use cases and persistence.
- `Application/Services`
  Business use cases and orchestration.
- `Application/Mapping`
  Mapping from entities to DTOs.
- `Data`
  Active EF Core context and runtime seed bootstrap.
- `Infrastructure`
  JWT, DI, Swagger, CORS and other technical concerns.
- `Models`
  Active persistence/domain entities.
- `DTOs`
  Request and response contracts.

## Legacy folders

These folders are intentionally excluded from compilation in `ServiceDesk.API.csproj` and should not receive new runtime code:

- `Domain`
- `Infrastructure/Data`
- `Infrastructure/Seed`
- `Services`

## Dependency direction

- `Controllers -> Application/Abstractions`
- `Application/Services -> Application/Abstractions + Models`
- `Infrastructure/Data -> Application/Abstractions`
- `Infrastructure/Auth -> Models`

## Rule for new code

1. Define contracts in `Application/Abstractions`.
2. Implement behavior in `Application/Services`.
3. Keep controllers thin.
4. Register implementations in `Application/DependencyInjection.cs`.
5. Do not add new active code to legacy folders.
