"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronLeft, Check } from 'lucide-react';

export interface Step {
  id: number;
  title: string;
  isCompleted: boolean;
  description?: string;
}

interface ChecklistProps {
  steps: Step[];
  title?: string;
  activeStepId?: number;
  onSelectStep?: (id: number) => void;
  defaultExpanded?: boolean;
}

export const OnboardingChecklist: React.FC<ChecklistProps> = ({
  steps,
  title = "هەنگاوەکانی دەستپێکردن",
  activeStepId,
  onSelectStep,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const totalSteps = steps.length;
  const springConfig = { type: "spring", stiffness: 300, damping: 30 } as const;

  return (
    <div className="w-full flex flex-col items-center justify-center relative select-none" dir="rtl">
      <motion.div
        layout
        transition={springConfig}
        className="w-full max-w-lg bg-[#F5F5F7] dark:bg-[#161616] border border-[#E5E5E5] dark:border-white/10 rounded-2xl shadow-sm overflow-hidden"
      >
        {/* Header Section */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <motion.div
              animate={{ rotate: isExpanded ? 0 : 180 }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[#A1A1A1] shrink-0"
            >
              <ChevronUp size={20} />
            </motion.div>
            <span className="font-bold text-[#1A1A1A] dark:text-[#EDEDED] text-[14px] sm:text-[15px] truncate pr-1">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 mr-1" dir="ltr">
            <span className="text-[12px] sm:text-[13px] font-bold text-[#71717A] dark:text-[#888] min-w-7 sm:min-w-7.5 text-right font-mono">
              {completedCount}/{totalSteps}
            </span>

            <div className="flex gap-0.5 xs:gap-[3px]">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-3.5 sm:h-4 w-[2.5px] sm:w-[3.5px] rounded-full transition-colors duration-500 ${
                    i < (completedCount / totalSteps) * 14
                      ? 'bg-[#22C55E]'
                      : 'bg-[#E5E5E7] dark:bg-[#2A2A2A]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Expanded Checklist Items */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={springConfig}
              className="border-t-[1.4px] border-[#E9E8EF] dark:border-white/5 bg-white dark:bg-[#1C1C1C] rounded-t-3xl sm:rounded-t-[20px]"
            >
              <div className="p-2 sm:p-2.5 space-y-1">
                {steps.map((step) => {
                  const isActive = activeStepId === step.id;
                  return (
                    <div
                      key={step.id}
                      onClick={() => onSelectStep?.(step.id)}
                      className={`group flex items-center justify-between p-2.5 sm:p-3 px-3 sm:px-4 rounded-xl cursor-pointer transition-all active:scale-[0.99] ${
                        isActive
                          ? 'bg-neutral-100 dark:bg-white/10 ring-1 ring-neutral-300 dark:ring-white/20'
                          : 'hover:bg-[#F9F9F9] dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        {step.isCompleted ? (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#00B613] shadow-sm shadow-[#238848]/30 flex items-center justify-center shrink-0">
                            <Check size={12} strokeWidth={3.5} className="text-white" />
                          </div>
                        ) : (
                          <div
                            className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[11px] sm:text-[12px] font-bold shrink-0 transition-colors ${
                              isActive
                                ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-900 shadow-sm'
                                : 'border-[#D5D5D7] dark:border-[#444] text-[#818181] dark:text-[#777]'
                            }`}
                          >
                            {step.id}
                          </div>
                        )}
                        <div className="flex flex-col truncate">
                          <span
                            className={`text-[13px] sm:text-[14px] font-medium transition-colors truncate ${
                              isActive
                                ? 'text-neutral-900 dark:text-white font-bold'
                                : step.isCompleted
                                ? 'text-neutral-700 dark:text-neutral-300'
                                : 'text-[#1A1A1A] dark:text-[#D4D4D4]'
                            }`}
                          >
                            {step.title}
                          </span>
                          {step.description && (
                            <span className="text-[11px] text-muted-foreground truncate">
                              {step.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {!step.isCompleted && (
                        <ChevronLeft size={16} className="text-[#A1A1A6] dark:text-[#555] shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};