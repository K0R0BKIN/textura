'use client';

import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export type ConversationProps = ComponentProps<'div'>;

export function Conversation({ className, ...props }: ConversationProps) {
  return <div className={cn('relative', className)} role="log" {...props} />;
}

export type ConversationContentProps = ComponentProps<'div'>;

export function ConversationContent({
  className,
  ...props
}: ConversationContentProps) {
  return <div className={cn('flex flex-col p-4', className)} {...props} />;
}
