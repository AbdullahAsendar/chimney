import { Outlet } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';

export function ClassicLayout() {
  return (
    <>
      <style>
        {`
          .page-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10.png')}');
          }
          .dark .page-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10-dark.png')}');
          }
        `}
      </style>
      <div className="flex flex-col items-center justify-center grow bg-center bg-repeat page-bg">
        <Outlet />
      </div>
    </>
  );
}
