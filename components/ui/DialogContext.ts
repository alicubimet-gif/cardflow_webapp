'use client';

import { createContext } from 'react';

export interface DialogOptions {
  title: string;
  message: string;
  detail?: string;
  variant?: 'default' | 'danger' | 'warning';
  confirmText?: string;
  cancelText?: string;
}

export interface AlertDialogOptions {
  title: string;
  message: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
  confirmText?: string;
}

export interface PromptDialogOptions {
  title: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
}

export interface DialogContextType {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: AlertDialogOptions) => Promise<void>;
  prompt: (options: PromptDialogOptions) => Promise<string | null>;
}

export const DialogContext = createContext<DialogContextType | undefined>(undefined);
