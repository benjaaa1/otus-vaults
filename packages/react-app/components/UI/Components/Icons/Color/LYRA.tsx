import * as React from 'react'

const LyraIcon = (props) => (
  <svg
    width={34}
    height={34}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#a)">
      <path
        d="M17 34c9.389 0 17-7.611 17-17S26.389 0 17 0 0 7.611 0 17s7.611 17 17 17Z"
        fill="url(#b)"
      />
      <mask
        id="d"
        style={{
          maskType: 'alpha',
        }}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={34}
        height={34}
      >
        <path
          d="M17 34c9.389 0 17-7.611 17-17S26.389 0 17 0 0 7.611 0 17s7.611 17 17 17Z"
          fill="url(#c)"
        />
      </mask>
      <g mask="url(#d)">
        <path
          d="M11.4 12.773a.715.715 0 0 0-.56-.26H6.298a.131.131 0 0 1-.099-.038.117.117 0 0 1-.037-.084V9.33c0-.03.012-.059.037-.084a.131.131 0 0 1 .099-.039h4.798c1.21 0 2.255.495 3.133 1.484l1.165 1.423-2.27 2.77-1.726-2.112Zm8.385-2.096c.878-.98 1.927-1.469 3.148-1.469h4.784c.04 0 .07.01.09.03.02.021.03.052.03.093v3.06c0 .03-.01.059-.03.084-.02.025-.05.038-.09.038h-4.541a.715.715 0 0 0-.56.26l-3.345 4.07 3.36 4.1a.717.717 0 0 0 .545.245h4.54c.04 0 .071.013.091.039.02.025.03.058.03.099v3.06c0 .03-.01.059-.03.084-.02.026-.05.038-.09.038h-4.784c-1.22 0-2.265-.494-3.133-1.484l-2.785-3.396-2.785 3.396c-.878.99-1.927 1.484-3.148 1.484H6.299c-.04 0-.071-.012-.091-.038a.154.154 0 0 1-.03-.1v-3.06c0-.03.01-.058.03-.084.02-.025.05-.038.09-.038h4.541a.744.744 0 0 0 .56-.26l3.285-4.009 5.101-6.242Z"
          fill="#00D1FF"
        />
      </g>
    </g>
    <defs>
      <linearGradient
        id="b"
        x1={17}
        y1={0}
        x2={17}
        y2={49.712}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#08021E" />
        <stop offset={1} stopColor="#1F0777" />
      </linearGradient>
      <linearGradient
        id="c"
        x1={17}
        y1={0}
        x2={17}
        y2={49.712}
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#08021E" />
        <stop offset={1} stopColor="#1F0777" />
      </linearGradient>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h34v34H0z" />
      </clipPath>
    </defs>
  </svg>
)

export default LyraIcon
