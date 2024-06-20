'use client';
import CountUp from "react-countup"
const AnimatedCountup = ({amount}:{amount:number}) => {
  return (
    <div className="w-full">
      <CountUp end={amount} decimal="." prefix="$" duration={2} decimals={2}/>
    </div>
  )
}

export default AnimatedCountup
