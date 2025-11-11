import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  disabled?: boolean
  placeholder?: string
}

export function DateTimePicker({
  date,
  onDateChange,
  disabled = false,
  placeholder = "Pick a date and time",
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hours, setHours] = React.useState<string>(
    date ? String(date.getHours()).padStart(2, "0") : "00"
  )
  const [minutes, setMinutes] = React.useState<string>(
    date ? String(date.getMinutes()).padStart(2, "0") : "00"
  )

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate)
      newDate.setHours(parseInt(hours), parseInt(minutes))
      onDateChange(newDate)
    } else {
      onDateChange(undefined)
    }
  }

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    setHours(newHours)
    setMinutes(newMinutes)

    if (date) {
      const newDate = new Date(date)
      newDate.setHours(parseInt(newHours), parseInt(newMinutes))
      onDateChange(newDate)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-1 h-4 w-4" />
          {date ? format(date, "PPP HH:mm") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-w-sm" align="start" side="bottom">
        <div className="space-y-4 p-4 w-full overflow-hidden">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={disabled}
          />

          {/* Time Picker */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Time</span>
            </div>

            <div className="flex items-center justify-center gap-4 bg-muted p-4 rounded-lg">
              {/* Hours */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const newH = String((parseInt(hours) + 1) % 24).padStart(2, "0")
                    handleTimeChange(newH, minutes)
                  }}
                  className="p-1 hover:bg-primary hover:text-primary-foreground rounded transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onChange={(e) => {
                    let h = e.target.value
                    if (h === "") h = "0"
                    h = String(Math.max(0, Math.min(23, parseInt(h) || 0))).padStart(2, "0")
                    handleTimeChange(h, minutes)
                  }}
                  className="w-16 h-12 px-2 py-1 border border-input rounded text-center text-lg font-bold bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newH = String((parseInt(hours) - 1 + 24) % 24).padStart(2, "0")
                    handleTimeChange(newH, minutes)
                  }}
                  className="p-1 hover:bg-primary hover:text-primary-foreground rounded transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <label className="text-xs font-medium text-muted-foreground">Hours</label>
              </div>

              <div className="text-2xl font-bold text-foreground">:</div>

              {/* Minutes */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const newM = String((parseInt(minutes) + 5) % 60).padStart(2, "0")
                    handleTimeChange(hours, newM)
                  }}
                  className="p-1 hover:bg-primary hover:text-primary-foreground rounded transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => {
                    let m = e.target.value
                    if (m === "") m = "0"
                    m = String(Math.max(0, Math.min(59, parseInt(m) || 0))).padStart(2, "0")
                    handleTimeChange(hours, m)
                  }}
                  className="w-16 h-12 px-2 py-1 border border-input rounded text-center text-lg font-bold bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newM = String((parseInt(minutes) - 5 + 60) % 60).padStart(2, "0")
                    handleTimeChange(hours, newM)
                  }}
                  className="p-1 hover:bg-primary hover:text-primary-foreground rounded transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <label className="text-xs font-medium text-muted-foreground">Minutes</label>
              </div>
            </div>
          </div>

          {/* Clear Button */}
          {date && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDateChange(undefined)
                setIsOpen(false)
              }}
              className="w-full"
            >
              Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
