import React from 'react';
import { Accordion as NBAccordion } from 'native-base';

interface AccordionItem {
  title: string;
  content: React.ReactNode;
  isDisabled?: boolean;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  allowToggle?: boolean;
  defaultIndex?: number | number[];
  onChange?: (index: number | number[]) => void;
  variant?: 'filled' | 'unfilled';
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  allowToggle = true,
  defaultIndex,
  onChange,
  variant = 'unfilled',
}) => {
  const accordionItems = items.map((item, index) => ({
    title: item.title,
    content: item.content,
    isDisabled: item.isDisabled,
  }));

  return (
    <NBAccordion
      allowMultiple={allowMultiple}
      allowToggle={allowToggle}
      defaultIndex={defaultIndex}
      onChange={onChange}
      variant={variant}
    >
      {accordionItems.map((item, index) => (
        <NBAccordion.Item key={index} isDisabled={item.isDisabled}>
          <NBAccordion.Summary>
            {item.title}
          </NBAccordion.Summary>
          <NBAccordion.Details>
            {item.content}
          </NBAccordion.Details>
        </NBAccordion.Item>
      ))}
    </NBAccordion>
  );
};
