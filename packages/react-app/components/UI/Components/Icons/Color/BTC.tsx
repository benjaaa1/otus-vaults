import * as React from 'react'

const BTCIcon = (props) => (
  <svg
    width={44}
    height={44}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#a)">
      <mask
        id="c"
        style={{
          maskType: 'alpha',
        }}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={44}
        height={44}
      >
        <path
          d="M22 44c12.15 0 22-9.85 22-22S34.15 0 22 0 0 9.85 0 22s9.85 22 22 22Z"
          fill="url(#b)"
        />
      </mask>
      <g mask="url(#c)">
        <path
          d="M22 38.867c9.315 0 16.867-7.552 16.867-16.867 0-9.315-7.552-16.867-16.867-16.867-9.315 0-16.867 7.552-16.867 16.867 0 9.315 7.552 16.867 16.867 16.867Z"
          fill="#0E052F"
        />
        <path
          d="M22 38.867c9.315 0 16.867-7.552 16.867-16.867 0-9.315-7.552-16.867-16.867-16.867-9.315 0-16.867 7.552-16.867 16.867 0 9.315 7.552 16.867 16.867 16.867Z"
          fill="#627EEA"
        />
        <path
          d="M22.525 9.35v9.35l7.903 3.532L22.525 9.35Z"
          fill="#fff"
          fillOpacity={0.602}
        />
        <path d="m22.525 9.35-7.904 12.882 7.904-3.532V9.35Z" fill="#fff" />
        <path
          d="M22.525 28.291v6.354l7.908-10.942-7.908 4.588Z"
          fill="#fff"
          fillOpacity={0.602}
        />
        <path d="M22.525 34.645V28.29l-7.904-4.587 7.904 10.942Z" fill="#fff" />
        <path
          d="m22.525 26.82 7.903-4.588-7.903-3.53v8.119Z"
          fill="#fff"
          fillOpacity={0.2}
        />
        <path
          d="m14.62 22.232 7.905 4.589v-8.118l-7.904 3.529Z"
          fill="#fff"
          fillOpacity={0.602}
        />
      </g>
    </g>
    <defs>
      <linearGradient
        id="b"
        x1={22}
        y1={0}
        x2={22}
        y2={64.333}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#08021E" />
        <stop offset={1} stopColor="#1F0777" />
      </linearGradient>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h44v44H0z" />
      </clipPath>
    </defs>
  </svg>
)

export default BTCIcon
