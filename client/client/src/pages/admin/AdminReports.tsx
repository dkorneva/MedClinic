import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DatePicker, Progress } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { ApiError } from '../../shared/api/http/client';
import { getAdminReports, type AdminDailyRevenue } from '../../entities/admin';
import PageEmpty from '../../components/PageEmpty';
import PageError from '../../components/PageError';
import PageLoading from '../../components/PageLoading';
import {
  analyticsRowStyle,
  chartScrollContainerStyle,
  chartWrapperStyle,
  chartYAxisStyle,
  doctorLineStyle,
  doctorNameStyle,
  doctorRowStyle,
  getStatValueStyle,
  headerControlsStyle,
  headerRowStyle,
  pageStyle,
  panelStyle,
  panelTitleStyle,
  statCardStyle,
  statGridStyle,
  statLabelStyle,
  titleStyle,
} from './AdminReports.styles';

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

export default function AdminReports() {
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs('2026-04-01'),
    dayjs('2026-05-01'),
  ]);

  const reportParams = useMemo(
    () => ({
      start: range?.[0]?.toISOString(),
      end: range?.[1]?.toISOString(),
    }),
    [range],
  );

  const reportsQuery = useQuery({
    queryKey: ['admin-reports', reportParams],
    queryFn: () => getAdminReports(reportParams),
  });

  if (reportsQuery.isLoading) {
    return <PageLoading />;
  }

  if (reportsQuery.isError) {
    return (
      <PageError
        message={reportsQuery.error instanceof ApiError ? reportsQuery.error.message : undefined}
      />
    );
  }

  const data = reportsQuery.data;
  if (!data) {
    return <PageEmpty description="Отчёты пока недоступны" />;
  }

  const chartData = data.currentMonthRevenueByDay;
  const chartMax = Math.max(...chartData.map((item) => item.revenue), 1);
  const hasData = chartData.some((item) => item.revenue > 0);
  const yAxisValues = hasData
    ? [chartMax, chartMax * 0.66, chartMax * 0.33, 0].map((value) =>
        currencyFormatter.format(value),
      )
    : [currencyFormatter.format(0)];

  const stats = [
    { value: currencyFormatter.format(data.revenue), label: 'Выручка за период', color: '#722ED1' },
    { value: String(data.totalAppointments), label: 'Всего приёмов', color: '#1677FF' },
    { value: `${data.completionRate}%`, label: 'Процент завершения', color: '#52C41A' },
  ];

  return (
    <div style={pageStyle}>
      <div style={headerRowStyle}>
        <h1 style={titleStyle}>Отчёты и аналитика</h1>
        <div style={headerControlsStyle}>
          <DatePicker.RangePicker
            value={range}
            format="DD.MM.YYYY"
            onChange={(nextRange) => setRange(nextRange as [Dayjs, Dayjs] | null)}
          />
        </div>
      </div>

      <div style={statGridStyle}>
        {stats.map((stat) => (
          <div key={stat.label} style={statCardStyle}>
            <div style={getStatValueStyle(stat.color)}>{stat.value}</div>
            <p style={statLabelStyle}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div style={analyticsRowStyle}>
        <div style={panelStyle}>
          <h2 style={panelTitleStyle}>Доходы за текущий месяц</h2>
          {chartData.length === 0 ? (
            <PageEmpty description="Нет данных по доходам за текущий месяц" />
          ) : (
            <div style={chartScrollContainerStyle}>
              <div style={{ ...chartWrapperStyle, minWidth: Math.max(chartData.length * 28, 760) }}>
                <div style={chartYAxisStyle}>
                  {yAxisValues.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
                <div
                  style={{
                    position: 'relative',
                    borderLeft: '1px solid #E5E7EB',
                    borderBottom: '1px solid #E5E7EB',
                    padding: '8px 12px',
                    height: 260,
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-start',
                    gap: 8,
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.05) 1px, transparent 1px) 0 0/100% 20%',
                    flex: 1,
                  }}
                >
                  {chartData.map((item: AdminDailyRevenue) => (
                    <div
                      key={item.dateKey}
                      title={`${dayjs(item.dateKey).format('DD.MM')}: ${currencyFormatter.format(item.revenue)}`}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: item.revenue > 0 ? `${(item.revenue / chartMax) * 100}%` : '4px',
                        minHeight: item.revenue > 0 ? 0 : '4px',
                        borderRadius: 6,
                        background: item.revenue > 0 ? '#722ED1' : '#E5E7EB',
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    gridColumn: '2 / 3',
                    display: 'flex',
                    gap: 10,
                    color: '#8C8C8C',
                    fontFamily: '"Segoe UI"',
                    fontSize: 12,
                    lineHeight: '16px',
                    padding: '0 12px',
                  }}
                >
                  {chartData.map((item: AdminDailyRevenue, index) => (
                    <span
                      key={item.dateKey}
                      style={{ width: 18, minWidth: 18, textAlign: 'center' }}
                    >
                      {index === 0 || index === chartData.length - 1 || index % 2 === 1
                        ? dayjs(item.dateKey).format('DD')
                        : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <h2 style={panelTitleStyle}>Загрузка врачей</h2>
          {data.doctorLoads.length === 0 ? (
            <PageEmpty description="В БД пока нет расписания активных врачей" />
          ) : (
            <div style={doctorRowStyle}>
              {data.doctorLoads.map((doctor) => (
                <div key={doctor.doctorId} style={doctorLineStyle}>
                  <p style={doctorNameStyle}>{doctor.doctorName}</p>
                  <Progress
                    percent={Number(doctor.loadPercent)}
                    showInfo
                    strokeColor={getLoadColor(doctor.loadPercent)}
                    trailColor="#F5F5F5"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getLoadColor(percent: number) {
  if (percent >= 80) {
    return '#F5222D';
  }

  if (percent >= 60) {
    return '#FA8C16';
  }

  return '#52C41A';
}
