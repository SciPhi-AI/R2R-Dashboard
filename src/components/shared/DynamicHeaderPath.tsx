import { ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import React from 'react';

import { Logo } from '@/components/shared/Logo';
import { Code } from '@/components/ui/Code';
import { capitalizeFirstLetter } from '@/lib/utils';

const DynamicHeaderPath = () => {
  const router = useRouter();

  const isPipelineRoute = router.pathname.includes('/pipeline/');
  const stripPath = router.asPath.split('?')[0];
  const pathSegments = isPipelineRoute
    ? stripPath.split('/').filter(Boolean)
    : [];

  const pipelineId = pathSegments.length > 1 ? pathSegments[1] : null;
  const afterPipelineSegment = pathSegments.length > 2 ? pathSegments[2] : null;

  const redirectToHome = () => {
    router.push('/');
  };

  return (
    <div>
      <ul role="list" className="flex items-center gap-3 pt-2">
        <Logo width={25} height={25} />
        <Code onClick={redirectToHome} style={{ cursor: 'pointer' }}>
          <span className="text-zinc-800 dark:text-zinc-400 ">
            R2R Dashboard
          </span>
        </Code>
        {isPipelineRoute && (
          <>
            <Code>
              <ChevronDoubleRightIcon className="w-4 h-4" strokeWidth={2} />
            </Code>
            <Code>
              <span className="text-blue-500">
                {afterPipelineSegment
                  ? `${capitalizeFirstLetter(afterPipelineSegment)}:`
                  : 'Pipeline:'}
              </span>
            </Code>
            <Code>
              <span className="text-zinc-400">{pipelineId}</span>
            </Code>
          </>
        )}
      </ul>
    </div>
  );
};

export default DynamicHeaderPath;
