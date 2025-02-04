export type OperationName =
  | "account_create"           //0
  | "account_update"           //1

  | "transfer"                 //2
  | "transfer_to_qi"           //3
  | "withdraw_qi"              //4
  | "set_withdraw_qi_route"    //5
  | "delegate_qi"              //6

  | "siming_update"            //7
  | "siming_set_properties"    //8
  | "account_siming_adore"     //9
  | "account_siming_proxy"     //10
  | "decline_adoring_rights"   //11

  | "custom"                   //12
  | "custom_json"              //13

  | "request_account_recovery" //14
  | "recover_account"          //15
  | "change_recovery_account"  //16

  | "claim_reward_balance"     //17

  // contract
  | "create_contract"          //18
  | "revise_contract"          //19
  | "call_contract_function"   //20

  // nfa (non fungible asset)
  | "create_nfa_symbol"        //21
  | "create_nfa"               //22
  | "transfer_nfa"             //23
  | "approve_nfa_active"       //24
  | "action_nfa"               //25

  // zone
  | "create_zone"              //26

  // actor
  | "create_actor_talent_rule" //27
  | "create_actor"             //28

export type VirtualOperationName =
  | "hardfork"                 //29
  | "fill_qi_withdraw"         //30
  | "return_qi_delegation"     //31
  | "producer_reward"          //32

  | "nfa_convert_resources"    //33
  | "nfa_trasfer"              //34 TODO(@enpitsulin): maybe typo
  | "nfa_deposit_withdraw"     //35
  | "reward_feigang"           //36
  | "reward_cultivation"       //37

  | "tiandao_year_change"      //38
  | "tiandao_month_change"     //39
  | "tiandao_time_change"      //40

  | "actor_born"               //41
  | "actor_talent_trigger"     //42
  | "actor_movement"           //43
  | "actor_grown"              //44

  | "narrate_log"              //45

export interface Operation {
  0: OperationName | VirtualOperationName
  1: Record<string, any>
}
