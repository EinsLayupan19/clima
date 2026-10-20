import {
  CloudFogIcon,
  CloudIcon,
  CloudLightningIcon,
  CloudMoonIcon,
  CloudRainIcon,
  CloudSnowIcon,
  CloudSunIcon,
  MoonIcon,
  QuestionIcon,
  SunIcon,
  type IconProps,
} from '@phosphor-icons/react'
import type { ComponentType } from 'react'
import type { WeatherIconName } from '../types/weather.ts'

const ICONS: Record<WeatherIconName, ComponentType<IconProps>> = {
  'clear-day': SunIcon,
  'clear-night': MoonIcon,
  'partly-cloudy-day': CloudSunIcon,
  'partly-cloudy-night': CloudMoonIcon,
  cloudy: CloudIcon,
  fog: CloudFogIcon,
  rain: CloudRainIcon,
  snow: CloudSnowIcon,
  thunderstorm: CloudLightningIcon,
  unknown: QuestionIcon,
}

interface WeatherIconProps extends IconProps {
  name: WeatherIconName
}

/** Decorative condition icon. Always pair it with a text label. */
function WeatherIcon({ name, ...props }: WeatherIconProps) {
  const Icon = ICONS[name]
  return <Icon aria-hidden="true" {...props} />
}

export default WeatherIcon
