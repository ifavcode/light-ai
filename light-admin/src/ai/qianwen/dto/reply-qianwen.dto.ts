export class replyQianwenDTO {
  id: string;
  choices: any[];
  created: number;
  model: string;
  object: string;
  service_tier: string | null;
  system_fingerprint: string | null;
  usage?: any;

  constructor(
    id: string,
    choices: any[],
    created: number,
    model: string,
    object: string,
    service_tier: string | null,
    system_fingerprint: string | null,
    usage?: any,
  ) {
    this.id = id;
    this.choices = choices;
    this.created = created;
    this.model = model;
    this.object = object;
    this.service_tier = service_tier;
    this.system_fingerprint = system_fingerprint; 
    if (usage) {
      this.usage = usage;
    }
  }
}
