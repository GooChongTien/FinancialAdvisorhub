import { Button } from "@/admin/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/admin/components/ui/card";
import { Plus } from "lucide-react";

export default function LifeEventSimulator({ customerId, financialData, onEventsChange }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Life Event Simulator</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Add life events to see their impact on the wealth projection.
                    </p>

                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Life Event
                    </Button>

                    <div className="mt-6 p-8 bg-gray-50 rounded-lg text-center">
                        <p className="text-gray-500">No life events added yet</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
