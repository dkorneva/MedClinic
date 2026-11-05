-- Equivalent of ServiceNamesBySpecialty.Up for an existing SQL Server database.
-- Keeps all services and appointments. Safe to run again.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20261006120000_ServiceNamesBySpecialty')
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260408175343_DoctorDiagnosesAndTreatment')
        THROW 50000, 'Apply the preceding MedClinic migrations first.', 1;
    DROP INDEX [IX_Categories_Name] ON [Categories];
    CREATE UNIQUE INDEX [IX_Categories_DoctorSpecialty_Name] ON [Categories] ([DoctorSpecialty], [Name]);
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
        VALUES (N'20261006120000_ServiceNamesBySpecialty', N'8.0.25');
END;
COMMIT TRANSACTION;
