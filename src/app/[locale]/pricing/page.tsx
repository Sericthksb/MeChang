import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('pricing');

  const tiers = [
    {
      title: t('freeTitle'),
      price: t('freePrice'),
      features: [t('freeFeature1'), t('freeFeature2'), t('freeFeature3'), t('freeFeature4')],
      highlight: false,
    },
    {
      title: t('starterTitle'),
      price: t('starterPrice'),
      features: [t('starterFeature1'), t('starterFeature2'), t('starterFeature3')],
      highlight: false,
    },
    {
      title: t('growthTitle'),
      price: t('growthPrice'),
      features: [t('growthFeature1'), t('growthFeature2'), t('growthFeature3')],
      highlight: false,
    },
    {
      title: t('proTitle'),
      price: t('proPrice'),
      features: [t('proFeature1'), t('proFeature2'), t('proFeature3')],
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 flex flex-col ${
                tier.highlight
                  ? 'bg-orange-50 border border-orange-500 shadow-md relative'
                  : 'bg-white border border-gray-100 shadow-sm'
              }`}
            >
              <h3 className="text-xl font-semibold text-gray-900">{tier.title}</h3>
              <p className="mt-4 text-3xl font-bold text-gray-900">{tier.price}</p>
              
              <ul className="mt-8 flex-1 space-y-4">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start text-sm text-gray-600">
                    <svg className="h-5 w-5 text-orange-500 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/${locale}/become-a-provider`}
                className={`mt-8 block w-full text-center px-4 py-2 rounded-xl transition-colors font-medium ${
                  tier.highlight
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
                }`}
              >
                {t('getStarted')}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            {t('footerNote')}
          </p>
        </div>
      </div>
    </div>
  );
}
