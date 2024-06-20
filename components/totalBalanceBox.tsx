import { formatAmount } from "@/lib/utils"
import AnimatedCountup from "./AnimatedCountup"
import DoughnutChart from "./DoughnutChart"
const TotalBalanceBox = ({accounts=[],totalBanks,totalCurrentBalance}:TotlaBalanceBoxProps) => {
  return (
    <section className="total-balance">
      <div className="total-balance-chart">
         <DoughnutChart accounts={accounts}/>
        <div className="flex flex-col gap-6 ">
             <h2 className="header-2 whitespace-nowrap">
                 Bank Accounts:{totalBanks}
             </h2>
             <div className="flex flex-col gap-2">
                <p className="total-balance-label whitespace-nowrap">
                    Total Current Balance
                </p>
               <div className="total-balance-amount flex-center gap-2">
                <AnimatedCountup 
                amount={totalCurrentBalance}
                />
               
               </div>
             </div>
        </div>
      </div>
    </section>
  )
}

export default TotalBalanceBox
