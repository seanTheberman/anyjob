"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { enUS } from "date-fns/locale"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={enUS}
      showOutsideDays={showOutsideDays}
      className={cn("w-full p-3", className)}
      classNames={{
        root: "w-full",
        months: "flex flex-col",
        month: "w-full space-y-4",
        month_caption: "relative flex h-9 items-center justify-center",
        caption_label: "text-sm font-medium",
        nav: "absolute inset-x-3 top-3 flex items-center justify-between",
        button_previous: cn(
          "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        ),
        button_next: cn(
          "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "grid grid-cols-7 gap-1",
        weekday:
          "h-8 w-10 text-center text-[0.8rem] font-normal text-muted-foreground",
        weeks: "space-y-1",
        week: "grid grid-cols-7 gap-1",
        day: "relative h-10 w-10 p-0 text-center text-sm",
        day_button: cn(
          "h-10 w-10 p-0 font-normal aria-selected:opacity-100 inline-flex items-center justify-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground"
        ),
        selected:
          "bg-red-600 text-white hover:bg-red-700 hover:text-white focus:bg-red-600 focus:text-white",
        today: "bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
