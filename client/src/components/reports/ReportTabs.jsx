'use client'

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PlantHealthReport from '@/components/reports/PlantHealthReport';
import HistoricalDataReport from '@/components/reports/HistoricalDataReport';
import AIImageAnalysis from '@/components/reports/AIImageAnalysis';
import WaterConsumptionReport from '@/components/reports/WaterConsumptionReport';
import PlantDistributionReport from '@/components/reports/PlantDistributionReport';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ReportTabs({ plant }) {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    {
      name: t('reports.healthReport', 'Health Report'),
      content: <PlantHealthReport plant={plant} />,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      )
    },
    {
      name: t('reports.historicalData', 'Historical Data'),
      content: <HistoricalDataReport plant={plant} />,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      )
    },
    {
      name: t('reports.aiAnalysis', 'AI Analysis'),
      content: <AIImageAnalysis plant={plant} />,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
        </svg>
      )
    },
    {
      name: t('reports.waterUsage', 'Water Usage'),
      content: <WaterConsumptionReport plant={plant} />,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
        </svg>
      )
    },
    {
      name: t('reports.plantTypes', 'Plant Types'),
      content: <PlantDistributionReport />,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
        </svg>
      )
    }
  ];

  return (
    <div className="w-full">
      <div className="flex space-x-1 rounded-xl bg-emerald-50/80 p-1">
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => setSelectedTab(index)}
            className={classNames(
              'w-full py-2.5 text-sm font-medium leading-5',
              'flex items-center justify-center gap-2 rounded-lg',
              'focus:outline-none',
              selectedTab === index
                ? 'bg-white shadow text-emerald-700'
                : 'text-gray-600 hover:bg-white/[0.6] hover:text-emerald-600'
            )}
          >
            {tab.icon}
            <span className="hidden md:inline">{tab.name}</span>
          </button>
        ))}
      </div>
      
      <div className="mt-4">
        <div className="rounded-xl bg-white p-4 md:p-6 shadow-sm border border-gray-100 focus:outline-none">
          {tabs[selectedTab].content}
        </div>
      </div>
    </div>
  );
}