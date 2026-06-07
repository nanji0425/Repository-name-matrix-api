import { SignpostBig } from 'lucide-react';
import { ConsoleEmpty, ConsolePage } from '@/components/console/ConsoleShell';

export default function InvitePage() {
  return (
    <ConsolePage className="pb-24">
      <ConsoleEmpty icon={<SignpostBig className="h-9 w-9" />} title="功能开发中" desc="邀请推广功能正在开发中，敬请期待。" />
    </ConsolePage>
  );
}
