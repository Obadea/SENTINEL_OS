import * as React from 'react';

import {
  PreviewLinkCard as PreviewLinkCardPrimitive,
  PreviewLinkCardTrigger as PreviewLinkCardTriggerPrimitive,
  PreviewLinkCardPortal as PreviewLinkCardPortalPrimitive,
  PreviewLinkCardContent as PreviewLinkCardContentPrimitive,
  PreviewLinkCardImage as PreviewLinkCardImagePrimitive,
  type PreviewLinkCardProps as PreviewLinkCardPrimitiveProps,
  type PreviewLinkCardTriggerProps as PreviewLinkCardTriggerPrimitiveProps,
  type PreviewLinkCardContentProps as PreviewLinkCardContentPrimitiveProps,
  type PreviewLinkCardImageProps as PreviewLinkCardImagePrimitiveProps,
} from '@/components/animate-ui/primitives/radix/preview-link-card';
import { cn } from '@/lib/utils';

type PreviewLinkCardProps = PreviewLinkCardPrimitiveProps;

function PreviewLinkCard(props: PreviewLinkCardProps) {
  return <PreviewLinkCardPrimitive {...props} />;
}

type PreviewLinkCardTriggerProps = PreviewLinkCardTriggerPrimitiveProps;

const PreviewLinkCardTrigger = React.forwardRef<
  React.ComponentRef<typeof PreviewLinkCardTriggerPrimitive>,
  PreviewLinkCardTriggerProps
>((props, ref) => {
  return <PreviewLinkCardTriggerPrimitive ref={ref} {...props} />;
});
PreviewLinkCardTrigger.displayName = 'PreviewLinkCardTrigger';

type PreviewLinkCardContentProps = PreviewLinkCardContentPrimitiveProps;

const PreviewLinkCardContent = React.forwardRef<
  React.ComponentRef<typeof PreviewLinkCardContentPrimitive>,
  PreviewLinkCardContentProps
>(({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}, ref) => {
  return (
    <PreviewLinkCardPortalPrimitive>
      <PreviewLinkCardContentPrimitive
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 origin-(--radix-hover-card-content-transform-origin) rounded-md border shadow-md outline-hidden overflow-hidden',
          className,
        )}
        {...props}
      />
    </PreviewLinkCardPortalPrimitive>
  );
});
PreviewLinkCardContent.displayName = 'PreviewLinkCardContent';

type PreviewLinkCardImageProps = PreviewLinkCardImagePrimitiveProps;

function PreviewLinkCardImage(props: PreviewLinkCardImageProps) {
  return <PreviewLinkCardImagePrimitive {...props} />;
}

export {
  PreviewLinkCard,
  PreviewLinkCardTrigger,
  PreviewLinkCardContent,
  PreviewLinkCardImage,
  type PreviewLinkCardProps,
  type PreviewLinkCardTriggerProps,
  type PreviewLinkCardContentProps,
  type PreviewLinkCardImageProps,
};
